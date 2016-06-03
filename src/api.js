import libdebug from 'debug';
import Promise from 'bluebird';
import _ from 'lodash';

const debug = libdebug('ecs-cleaner:api');

export default class EcsTaskCleanerApi {
  config;

  /**
   * @type {AWS.ECS}
   */
  ecs;

  /**
   * @type {AWS.ECR}
   */
  ecr;

  apply = false;

  constructor(config, ecs, ecr) {
    this.config = config;
    this.ecs = ecs;
    this.ecr = ecr;
  }

  setApply(apply) {
    this.apply = apply;
  }

  /**
   * @returns {Promise.<String[]>}
   */
  getClusters() {
    debug('Getting clusters');

    return this.ecs.listClustersAsync()
      .then(res => res.clusterArns);
  }

  /**
   * Describes all the services on a cluster
   *
   * Calls itself recursively in a Promise.join to tail-recurse the rest of the services onto the list. (Gets
   * around the 10 service pagination limit)
   *
   * @returns {Promise.<Object[]>}
   */
  describeServices(cluster, nextToken = null) {
    debug('Listing services for cluster', cluster, nextToken ? 'paging' : 'first-page');

    return this.ecs.listServicesAsync({ cluster, nextToken })
      .then(res => {
        const describe = this.ecs.describeServicesAsync({ cluster, services: res.serviceArns })
          .then(descriptions => descriptions.services);

        if (res.nextToken) {
          return Promise.join(
            describe,
            this.describeServices(cluster, res.nextToken),
            (current, accumulator) => Promise.resolve(accumulator.concat(current))
          );
        }

        return describe;
      });
  }

  /**
   * Describe all the services in a region
   *
   * @returns {Promise.<Object[]>}
   */
  describeAllServices() {
    return Promise.map(this.getClusters(), cluster => this.describeServices(cluster))
      .then(_.flattenDeep);
  }

  /**
   * Gets basically all task definitions in an account
   *
   * @param nextToken
   * @returns {Promise.<Object[]>}
   */
  getCandidateTaskDefinitions(nextToken = null) {
    debug('Getting candidate task definitions', nextToken ? 'paging' : 'first-page');

    return this.ecs.listTaskDefinitionsAsync({ nextToken })
      .then(res => {
        if (res.nextToken) {
          return this.getCandidateTaskDefinitions(res.nextToken)
            .then(next => next.concat(res.taskDefinitionArns));
        }

        return res.taskDefinitionArns;
      });
  }

  deregisterTaskDefinition(defn) {
    if (!this.apply) {
      debug('Would have deactivated task definition, but doing a dry run', defn);
      return Promise.resolve();
    }

    process.stdout.write(`Deactivating task definition ${defn}\n`);

    return this.ecs.deregisterTaskDefinitionAsync({ taskDefinition: defn })
        .then(res => {
          debug('Got result from deactivate call', res);
          return Promise.resolve();
        })
        .catch(err => {
          debug(err.constructor.name);
          debug(err);
        });
  }

  /**
   * @param {object} description
   * @returns {String[]}
   */
  getTaskDefinitionsFromServiceDescription(description) {
    const defns = [description.taskDefinition];

    if (description.deployments) {
      description.deployments.forEach(deployment => {
        if (deployment.taskDefinition) {
          defns.push(deployment.taskDefinition);
        }
      });
    }

    return defns;
  }

  getActiveTaskDefinitions() {
    return Promise.map(
      this.describeAllServices(),
      this.getTaskDefinitionsFromServiceDescription
    )
      .then(_.flattenDeep)
      .then(_.uniq)
      .then(a => a.sort());
  }

  getImagesInActiveTaskDefinitions() {
    const mapDefinitionToImages = (defn) => {
      return _.chain(defn.containerDefinitions.map(c => c.image)).flattenDeep().value();
    };

    return Promise.map(this.getActiveTaskDefinitions(), this.describeTaskDefinition.bind(this))
      .then(defns => Promise.map(defns, mapDefinitionToImages))
      .then(_.flattenDeep)
      .then(_.uniq)
      .then(a => a.sort());
  }

  describeTaskDefinition(defn) {
    return this.ecs.describeTaskDefinitionAsync({ taskDefinition: defn })
      .then(res => res.taskDefinition);
  }

  describeRepositories(...names) {
    return this.ecr.describeRepositoriesAsync({ repositoryNames: names })
      .then(res => res.repositories);
  }
}
