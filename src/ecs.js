import AWS from 'aws-sdk';
import Promise from 'bluebird';
import libdebug from 'debug';

const debug = libdebug('ecs-task-cleaner:ecs');

export default (config) => Promise.promisifyAll(new AWS.ECS({
  region: config.REGION,
}));
