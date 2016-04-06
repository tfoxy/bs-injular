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
  config.logger = bs.getLogger(PLUGIN_NAME);
  config.emitNotify = config.notify ? emitNotify : ()=>{/*noop*/};
  config.logger.info('Running...');

  let middleware = middlewareFactory(config);
  bs.addMiddleware('', middleware, {id: 'bs-mw-injular', override: true});

  listenToFileChange(config, bs);


  function emitNotify(opts) {
    bs.io.sockets.emit('browser:notify', opts);
  }
}
