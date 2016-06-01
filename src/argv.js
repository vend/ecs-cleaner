import yargs from 'yargs';

export default () => yargs
  .option('r', {
    alias: 'region',
    required: true,
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
  .count('verbose')
  .alias('v', 'verbose')
  .argv;
