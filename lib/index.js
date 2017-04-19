'use strict';
const fs = require('fs');

const middlewareFactory = require('./middlewareFactory');
const listenToFileChange = require('./listenToFileChange');

const PLUGIN_NAME = 'Injular';

const DEFAULT_OPTIONS = {
  notify: true,
  supportIE8: false,
  reloadRouteOnTemplateInjection: false,
  avoidCleanScope: false
};

const injularContent = fs.readFileSync(require.resolve('injular'));
const clientContent = `
(function (bs) {
  'use strict';
  var exports = {};
  var module = { exports: exports };

  ${injularContent}

  var TEMPLATE_CHANGED_EVENT = 'injularTemplate:changed';
  var SCRIPT_CHANGED_EVENT = 'injularScript:changed';

  var sockets = bs.socket;
  var injular = module.exports;

  sockets.on(TEMPLATE_CHANGED_EVENT, injular.injectTemplate);
  sockets.on(SCRIPT_CHANGED_EVENT, injular.injectScript);
})(window.___browserSync___);
`;

const bsInjular = {
  'plugin:name': PLUGIN_NAME,
  'plugin': plugin,
  'hooks': {
    'client:js': clientContent
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
