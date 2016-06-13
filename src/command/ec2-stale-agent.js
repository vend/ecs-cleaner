import libdebug from 'debug';
import Promise from 'bluebird';
import moment from 'moment';
import _ from 'lodash';

const debug = libdebug('ecs-cleaner:command:ec2-stale-agent');

const CUTOFF = 1000 * 60 * 60 * 24;
const CUTOFF_DATE = new Date(Date.now() - CUTOFF);

export const command = 'ec2-stale-agent';
export const describe = 'Removes stale EC2 build agents';

export function builder() {
  return yargs => yargs
    .usage('ecs-cleaner ec2-stale-agent <key-name>')
    .demand(2);
}

export function handler(config, log, ec2) {
  function describeInstances(keyName) {
    const filters = [
      {
        Name: 'key-name',
        Values: [keyName],
      },
      {
        Name: 'instance-state-name',
        Values: ['running'],
      },
    ];

    return ec2.describeInstancesAsync({
      Filters: filters,
    })
      .then(res => res.Reservations.map(r => r.Instances))
      .then(_.flatten);
  }

  function shouldTerminateInstance(instance) {
    const id = instance.InstanceId;
    const launched = moment(instance.LaunchTime);
    const should = launched.toDate() < CUTOFF_DATE;

    log.debug(
      should
        ? `Deciding for ${id}: will terminate because launched ${launched.fromNow()}`
        : `Deciding for ${id}: won't terminate because launched ${launched.fromNow()}`
    );

    return should;
  }

  function terminateInstance(instance, argv) {
    const id = instance.InstanceId;

    log.info(
      argv.apply
        ? `About to terminate ${id}`
        : `Would have terminated ${id} but doing a dry run`
    );

    return ec2.terminateInstancesAsync({
      InstanceIds: [id],
    });
  }

  return (argv) => {
    const keyName = argv._[1];
    log.notice(`Cleaning out ec2 instances that were launched with key ${keyName}`);

    log.notice(
      argv.apply
        ? "You specified --apply, so we're about to start actually terminating these instances"
        : "You didn't specify --apply, so we're doing a dry run"
    );

    return Promise.map(
      describeInstances(keyName),
      instance => (
        shouldTerminateInstance(instance)
          ? terminateInstance(instance, argv)
          : Promise.resolve()
      )
    );
  };
}
