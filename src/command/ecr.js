import libdebug from 'debug';
import Promise from 'bluebird';
import moment from 'moment';

const debug = libdebug('ecs-cleaner:command:ecr');

const CUTOFF = 1000 * 60 * 60 * 24 * 7;
const CUTOFF_DATE = new Date(Date.now() - CUTOFF);

export const command = 'ecr';
export const describe = 'Removes stale and unused ECR images';

export function builder() {
  return yargs => yargs
    .usage('ecs-cleaner ecr <repo>')
    .demand(2, 2, 'You should specify an ECR repository name to clean');
}

export function handler(config, log, api) {
  /**
   * @param {Promise.<Object>} repo
   * @returns {Promise.<Array>}
   */
  function getActiveImagesInRepo(repo) {
    return Promise.join(repo, api.getImagesInActiveTaskDefinitions(), (repository, active) => {
      const uri = repository.repositoryUri;
      const filtered = active.filter(v => v.substr(0, uri.length) === uri);

      log.info(
        filtered.length > 0
          ? `Skipping active images, in use by ECS:\n  ${filtered.join('\n  ')}`
          : 'No active images, none are in use by ECS'
      );

      return filtered;
    });
  }

  /**
   * @param {Promise.<Object>} repo
   * @returns {Promise.<Array>}
   */
  function getAllImagesInRepo(repo) {
    return repo
      .then(repository => api.describeImages(repository.registryId, repository.repositoryName));
  }

  /**
   * @returns {Promise.<boolean>}
   */
  function decideIfImageShouldBeDeleted(repo, image, active) {
    if (!image.imageId.imageTag) {
      log.debug(`Deleting ${image.imageId.imageDigest} because image does not have a tag`);
      return Promise.resolve(true);
    }

    const tag = image.imageId.imageTag;

    if (tag.match(/^master/)) {
      log.debug(`Not deleting ${tag} because tag starts with master`);
      return Promise.resolve(false);
    }

    const created = api.getImageCreatedDate(image);
    const fromNow = moment(created).fromNow();

    if (created && created > CUTOFF_DATE) {
      log.debug(`Not deleting ${tag} because it was created ${fromNow}`);
      return Promise.resolve(false);
    }

    return Promise.join(repo, active, (repository, activeImages) => {
      if (activeImages.indexOf(`${repository.repositoryUri}:${tag}`) !== -1) {
        log.debug(`Not deleting ${tag} because it is in use`);
        return Promise.resolve(false);
      }

      log.debug(`Deleting ${tag}, because it was created ${fromNow} and is not in use`);
      return Promise.resolve(true);
    });
  }

  function deleteImage(image, apply = false) {
    const id = image.imageId.imageTag ? image.imageId.imageTag : image.imageId.imageDigest;

    log.notice(
      apply
        ? `Deleting ${id}`
        : `Would have deleted ${id}, but doing a dry run`
    );

    return apply
      ? api.deleteImage(image)
      : Promise.resolve();
  }

  return (argv) => {
    const repoName = argv._[1];
    debug(`Cleaning out repo ${repoName}`);

    const repo = api.describeRepository(repoName);
    const active = getActiveImagesInRepo(repo);

    if (argv.apply) {
      log.notice(`You specified --apply, so we're about to start actually deleting these images\n`);
    } else {
      log.notice(`You didn't specify --apply, so we're doing a dry run\n`);
    }

    return Promise.map(
      getAllImagesInRepo(repo),
      image => decideIfImageShouldBeDeleted(repo, image, active)
        .then(shouldBeDeleted => {
          if (shouldBeDeleted) {
            return deleteImage(image, argv.apply);
          }

          return Promise.resolve(); // nop
        }),
      { concurrency: 2 }
    );
  };
}
