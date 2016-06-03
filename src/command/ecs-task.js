import libdebug from 'debug';
import Promise from 'bluebird';
import _ from 'lodash';
import Api from './../api';

const debug = libdebug('ecs-cleaner:command:clean');

const KEEP_LATEST_PER_FAMILY = 5;

export const command = 'ecs-task';
export const describe = 'Marks stale and unused ECS tasks as inactive';

export function builder() {
  return yargs => yargs
    .option('r', {
      alias: 'region',
      required: false,
      requiresArg: true,
      describe: 'The AWS region to run in',
      type: 'string',
    })
    .option('i', {
      alias: 'mark-inactive',
      default: false,
      describe: 'Actually mark the task definitions inactive (default is to dry-run)',
      type: 'boolean',
    })
    .check((parsed) => {
      if (!parsed.region && !process.env.AWS_DEFAULT_REGION) {
        throw new Error('You must supply a region with --region, or set AWS_DEFAULT_REGION');
      }

      return true;
    });
}

export function handler(config, log, api) {
  function doClean() {
    const getActive = Promise.map(api.describeAllServices(), description => Api.getTaskDefinitionsFromServiceDescription(description))
      .then(_.flattenDeep)
      .then(_.uniq)
      .then(a => a.sort());

    const getCandidates = api.getCandidateTaskDefinitions();

    return Promise.join(getCandidates, getActive, (candidates, active) => {
      process.stdout.write(`Considering ${candidates.length} task definitions for removal\n\n`);

      // Filter for active
      process.stdout.write(`The following task definitions will NOT be removed, because they are in use:\n  ${active.join('\n  ')}\n`);
      candidates = _.difference(candidates, active);
      process.stdout.write(`Which means we are only considering ${candidates.length} task definitions\n\n`);

      // Filter for latest per family
      process.stdout.write(`Furthermore, we don't remove task definitions among the newest ${KEEP_LATEST_PER_FAMILY} per family\n`);
      const byFamily = _.groupBy(candidates, v => v.match(/^([^/]+)\/([A-Za-z0-9_-]+):([0-9]+)$/)[2]);

      Object.keys(byFamily).forEach((family) => {
        byFamily[family] = byFamily[family].slice(0, -5);
      });

      candidates = _.flatten(_.values(byFamily));
      process.stdout.write(`Which means we are only considering ${candidates.length} task definitions\n\n`);

      if (config.VERBOSE > 0) {
        process.stdout.write(`The full list of definitions to remove is:\n  ${candidates.join('\n  ')}\n`);
      }

      if (config.MARK_INACTIVE) {
        process.stdout.write(`You specified --mark-inactive, so we're about to start actually inactivating these definitions\n`);
      } else {
        process.stdout.write(`You didn't specify --mark-inactive, so we're doing a dry run\n`);
      }

      return Promise.map(candidates, api.deregisterTaskDefinition.bind(api), { concurrency: 2 });
    });
  }

  return (argv) => {
    return doClean()
      .then(() => process.exit(0))
      .catch((err) => {
        process.stderr.write(err.stack);
        process.exit(1);
      });
  };
};
