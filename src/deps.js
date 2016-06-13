import libdebug from 'debug';
import Bottle from 'bottlejs';

import api from './api';

import awsEcs from './aws/ecs';
import awsEcr from './aws/ecr';
import awsEc2 from './aws/ec2';

import { default as log, Log as LogSettings } from './util/log';

import * as commandEcsTask from './command/ecs-task';
import * as commandEcr from './command/ecr';
import * as commandEc2StaleAgent from './command/ec2-stale-agent';

const debug = libdebug('ecs-cleaner:deps');

export default (config) => {
  const deps = new Bottle();
  Bottle.config.strict = true;

  deps.constant('config', config);
  deps.service('cli.log', () => log);

  deps.service('api', api, 'config', 'aws.ecs', 'aws.ecr');

  deps.service('aws.ecs', awsEcs, 'config');
  deps.service('aws.ecr', awsEcr, 'config');
  deps.service('aws.ec2', awsEc2, 'config');

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
    command('ec2-stale-agent', commandEc2StaleAgent, ['aws.ec2']),
  ];

  deps.constant('cli.commands', commands);

  return deps;
};
