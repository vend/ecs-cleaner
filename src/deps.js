import libdebug from 'debug';
import Bottle from 'bottlejs';

import cli from './cli';
import config from './config';
import ecs from './ecs';

const debug = libdebug('ecs-task-cleaner:deps');

const deps = new Bottle();
Bottle.config.strict = true;

deps.constant('config', config());

deps.service('ecs', ecs, 'config');
deps.service('cli', cli, 'config', 'ecs');

export default deps.container;
