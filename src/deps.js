import libdebug from 'debug';
import Bottle from 'bottlejs';

import api from './api';
import argv from './argv';

import awsEcs from './aws/ecs';
import awsEcr from './aws/ecr';

import { default as log, Log as LogSettings } from './util/log';

import * as commandEcsTask from './command/ecs-task';
import * as commandEcr from './command/ecr';

const debug = libdebug('ecs-cleaner:deps');

export default (config) => {
  const deps = new Bottle();
  Bottle.config.strict = true;

  deps.constant('config', config);
  deps.service('cli.log', () => log);

  deps.service('api', api, 'argv', 'aws.ecs', 'aws.ecr');
  deps.service('argv', argv);

  deps.service('aws.ecs', awsEcs, 'config');
  deps.service('aws.ecr', awsEcr, 'config');

  /**
   * @param {string} name
   * @param {cli.command} instance
   * @param {Array.<string>} extraServices
   * @returns {string}
   */
  function command(name, instance, extraServices = []) {
    deps.constant(`cli.command.${name}`, instance.command);
    deps.constant(`cli.describe.${name}`, instance.describe);
    deps.service(`cli.handler.${name}`, instance.handler, 'config', 'cli.log', ...extraServices);
    deps.service(`cli.builder.${name}`, instance.builder || ((v) => v));

    return name;
  }

  const commands = [
    command('ecs-task', commandEcsTask, ['api']),
    command('ecr', commandEcr, ['api']),
  ];

  deps.constant('cli.commands', commands);

  return deps;
};
