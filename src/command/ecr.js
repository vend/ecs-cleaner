import libdebug from 'debug';
import Promise from 'bluebird';
import _ from 'lodash';

const debug = libdebug('ecs-cleaner:command:ecr');

export const command = 'ecr';
export const describe = 'Removes stale and unused ECR images';

export function builder() {
  return yargs => yargs
    .usage('ecs-cleaner ecr <repo>')
    .option('a', {
      alias: 'apply',
      default: false,
      describe: 'Actually apply the operation (default is a dry run)',
      type: 'boolean',
    })
    .demand(2);
}

export function handler(config, log, api) {
  return (argv) => {
    const repo = argv._[1];

    const getRepoUrl = api.describeRepositories(repo)
      .then(descriptions => descriptions[0].repositoryUri);

    const getActiveImages = api.getImagesInActiveTaskDefinitions();

    return Promise.join(getRepoUrl, getActiveImages, (url, active) => {
      log.notice(`Cleaning out repo ${url}`);

      // TODO prefix diff the active images against the repo URL
      // Then filter those out
      // Then go through each image, describe, find the created date, and do final filtering

      if (argv.apply) {
        log.notice(`You specified --apply, so we're about to start actually deleting these images\n`);
      } else {
        log.notice(`You didn't specify --apply, so we're doing a dry run\n`);
      }
    });
  };
}
