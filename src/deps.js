import libdebug from 'debug';
import Bottle from 'bottlejs';

import api from './api';
import argv from './argv';
import clean from './clean';
import config from './config';
import ecs from './ecs';

const debug = libdebug('ecs-task-cleaner:deps');

const deps = new Bottle();
Bottle.config.strict = true;

deps.service('api', api, 'config', 'ecs');
deps.service('argv', argv);
deps.service('config', config, 'argv');
deps.service('clean', clean, 'config', 'api');
deps.service('ecs', ecs, 'config');

export default deps.container;
