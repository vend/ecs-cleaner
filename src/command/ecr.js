import libdebug from 'debug';
import Promise from 'bluebird';
import _ from 'lodash';

const debug = libdebug('ecs-cleaner:command:ecr');

export const command = 'ecr';
export const describe = 'Removes stale and unused ECR images';

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
    if (argv.apply) {
      process.stdout.write(`You specified --apply, so we're about to start actually deleting these images\n`);
    } else {
      process.stdout.write(`You didn't specify --apply, so we're doing a dry run\n`);
    }

    return Promise.resolve();
  };
}
