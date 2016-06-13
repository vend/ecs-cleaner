#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const yargs = require('yargs');
const _ = require('lodash');

if (!fs.existsSync(path.join(__dirname, 'dist'))) {
  throw new Error('You must run the build first (usually, gulp build)');
}

/**
 * @typedef {Object} cli.command
 * @property {string} command
 * @property {string} describe
 * @property {cli.builder} builder
 * @property {cli.handler} handler
 */

/**
 * @typedef {function(yargs): yargs} cli.builder
 */

/**
 * @typedef {function(argv): Promise} cli.handler
 */

const config = require('./dist/config').default();
const deps = require('./dist/deps').default(config);
const Log = require('./dist/util/log').Log;

const libdebug = require('debug'); // This must be the first use of 'debug' (after config is loaded)
const debug = libdebug('ecs-cleaner:index');
debug('Starting ecs-cleaner CLI interface');

const container = deps.container;
const log = container.cli.log;

const cli = yargs
  .strict()
  .usage('Usage: ecs-cleaner <command> [options]')
  .options({
    apply: {
      alias: 'a',
      describe: 'Actually apply the operation (default is always a dry run)',
      global: true,
      type: 'boolean',
    },
    verbose: {
      alias: 'v',
      describe: 'Output more information (provide multiple times for more noise)',
      global: true,
      type: 'count',
    },
    quiet: {
      alias: 'q',
      describe: 'Output less information (provide multiple times for less noise)',
      global: true,
      type: 'count',
    },
  })
  .help('help');

deps.container.cli.commands.forEach((service) => {
  const command = _.get(container, `cli.command.${service}`, false);
  const description = _.get(container, `cli.describe.${service}`, false);

  if (!command || typeof command !== 'string') {
    throw new Error(`Invalid command while configuring CLI command ${service}: ${typeof command}`);
  }

  if (!description || typeof description !== 'string') {
    throw new Error(`Invalid description while configuring CLI command ${service}: ${typeof description}`);
  }

  cli.command(
    command,
    description,
    (builder) => {
      const original = _.get(container, `cli.builder.${service}`, {});

      switch (typeof original) {
        case 'function':
          return original(builder);
        case 'object':
          return builder.options(original);
        default:
          throw new Error('Unexpected type of builder');
      }
    },
    (argv) => {
      const original = _.get(container, `cli.handler.${service}`, false);

      if (!original || typeof original !== 'function') {
        throw new Error('Unexpected type of handler');
      }

      Log.setLevel(2 + argv.verbose - argv.quiet);

      return original(argv)
        .then(() => {
          log.notice('All done!');
          process.exit(0);
        })
        .catch(err => {
          if (typeof err === 'string') {
            log.error(err);
          } else if (err instanceof Error) {
            log.error(err.message);
            log.debug(err.stack);
          } else {
            log.error(err);
            throw err;
          }
          process.exit(3);
        });
    }
  );
});

const argv = cli.demand(1, 'You must supply a command to execute').argv;
