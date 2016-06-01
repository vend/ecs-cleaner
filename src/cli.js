import libdebug from 'debug';

const debug = libdebug('ecs-task-cleaner:cli');

function doClean(ecs) {
  return ecs.listTaskFamiliesAsync()
    .then(tasks => {

      console.log(tasks);

    });
}

export default (config, ecs) => () => {
  return doClean(ecs)
    .then(() => process.exit(0))
    .catch((err) => {
      process.stderr.write(err.stack);
      process.exit(1);
    });
};
