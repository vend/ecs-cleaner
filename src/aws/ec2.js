import AWS from 'aws-sdk';
import Promise from 'bluebird';
import libdebug from 'debug';

const debug = libdebug('ecs-cleaner:aws:ec2');

export default (config) => Promise.promisifyAll(new AWS.EC2({
  max_retries: 3,
  region: process.env.AWS_DEFAULT_REGION,
}));
