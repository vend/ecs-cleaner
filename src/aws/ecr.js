import AWS from 'aws-sdk';
import Promise from 'bluebird';
import libdebug from 'debug';

const debug = libdebug('ecs-cleaner:aws:ecr');

export default (config) => Promise.promisifyAll(new AWS.ECR({
  max_retries: 3,
  region: process.env.AWS_DEFAULT_REGION,
}));
