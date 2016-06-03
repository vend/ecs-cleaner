import AWS from 'aws-sdk';
import Promise from 'bluebird';
import libdebug from 'debug';

const debug = libdebug('ecs-cleaner:aws:ecs');

export default (config) => Promise.promisifyAll(new AWS.ECS({
  region: 'us-west-2',
  max_retries: 3,
}));
