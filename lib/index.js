'use strict';
const extend = require('extend');
const middlewareFactory = require('./middlewareFactory');
const listenToFileChange = require('./listenToFileChange');

const PLUGIN_NAME = 'Injular';
const CLIENT_JS = '/../client/client.js';

const DEFAULT_OPTIONS = {
  templates: '**/app/**/*.html',
  notify: true,
  reloadRouteOnTemplateInjection: false
};

const bsInjular = {
  'plugin:name': PLUGIN_NAME,
  'plugin': plugin,
  'hooks': {
    'client:js': require('fs').readFileSync(__dirname + CLIENT_JS, 'utf-8')
  }
};

module.exports = bsInjular;


function plugin(opts, bs) {
  var config = extend({}, DEFAULT_OPTIONS, opts);
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
