'use strict';
const fs = require('fs');

const middlewareFactory = require('./middlewareFactory');
const listenToFileChange = require('./listenToFileChange');

const PLUGIN_NAME = 'Injular';
const CLIENT_JS = '/../client/injular.js';
const BS_HOOK_JS = '/../client/bs-hook.js';

const DEFAULT_OPTIONS = {
  notify: true,
  supportIE8: false,
  reloadRouteOnTemplateInjection: false,
  avoidCleanScope: false
};

const clientContent = fs.readFileSync(__dirname + CLIENT_JS, 'utf-8');
const bsHookContent = fs.readFileSync(__dirname + BS_HOOK_JS, 'utf-8');

const bsInjular = {
  'plugin:name': PLUGIN_NAME,
  'plugin': plugin,
  'hooks': {
    'client:js': clientContent + bsHookContent
  }
};

module.exports = bsInjular;


function plugin(opts, bs) {
  var config = Object.assign({}, DEFAULT_OPTIONS, opts);
  config.ngApp = config.ngApp || config.moduleName;
  var logger = bs.getLogger(PLUGIN_NAME);
  logger.info('Running...');
  logger.debug('bs-injular options:', opts);
  logger.trace('bs.options:', bs.options);
  config.logger = logger;
  config.emitNotify = config.notify ? emitNotify : ()=>{/*noop*/};

  let middleware = middlewareFactory(config);
  bs.addMiddleware('', middleware, {id: 'bs-mw-injular', override: true});

  listenToFileChange(config, bs);


  function emitNotify(opts) {
    bs.io.sockets.emit('browser:notify', opts);
  }
}
