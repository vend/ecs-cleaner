import libdebug from 'debug';
import Promise from 'bluebird';
import _ from 'lodash';

const debug = libdebug('ecs-task-cleaner:api');

export default class EcsTaskCleanerApi {
  config;
  ecs;

  constructor(config, ecs) {
    this.config = config;
    this.ecs = ecs;
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

  deactivateTaskDefinition(defn) {
    debug('Deactivating task definition', defn);

    return Promise.resolve();

    // return ecs.deactivateTaskDefinition();
  }

  /**
   * @param {object} description
   * @returns {String[]}
   */
  static getTaskDefinitionsFromServiceDescription(description) {
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
}
