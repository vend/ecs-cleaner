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
    .option('a', {
      alias: 'apply',
      default: false,
      describe: 'Actually apply the operation (default is a dry run)',
      type: 'boolean',
    });
}

export function handler(config, log, api) {
  return (argv) => {
    log.notice('Getting task definitions from AWS API');

    const getActive = Promise.map(
      api.describeAllServices(),
      description => api.getTaskDefinitionsFromServiceDescription(description)
    )
      .then(_.flattenDeep)
      .then(_.uniq)
      .then(a => a.sort());

    const getCandidates = api.getCandidateTaskDefinitions();

    return Promise.join(getCandidates, getActive, (candidates, active) => {
      log.notice(`Considering ${candidates.length} task definitions for removal`);

      // Filter for active
      log.info(`The following task definitions will NOT be removed, because they are in use:\n  ${active.join('\n  ')}`);
      candidates = _.difference(candidates, active);
      log.notice(`After active definition filtering, ${candidates.length} remain`);

      // Filter for latest per family
      log.info(`Furthermore, we don't remove task definitions among the newest ${KEEP_LATEST_PER_FAMILY} per family`);
      const byFamily = _.groupBy(candidates, v => v.match(/^([^/]+)\/([A-Za-z0-9_-]+):([0-9]+)$/)[2]);

      Object.keys(byFamily).forEach((family) => {
        byFamily[family] = byFamily[family].slice(0, -5);
      });

      candidates = _.flatten(_.values(byFamily));
      log.notice(`After family filtering, ${candidates.length} remain`);

      log.info(`The full list of definitions to remove is:\n  ${candidates.join('\n  ')}`);

      if (argv.apply) {
        log.notice("You specified --apply, so we're about to start actually inactivating these definitions");
      } else {
        log.notice('You didn\'t specify --apply, so we\'re doing a dry run');
      }

      return Promise.map(candidates, api.deregisterTaskDefinition.bind(api), { concurrency: 2 });
    });
  };
}
