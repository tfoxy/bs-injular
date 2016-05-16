'use strict';
const tamper = require('tamper');

const match = require('./match');
const fileChanger = require('./fileChanger');

module.exports = middlewareFactory;


function middlewareFactory(config) {
  const tamperTemplate = tamper(wrapTemplate);
  const tamperModule = tamper(appendProvideGetter);
  const tamperAngular = tamper(appendAngularModulePatch);
  return middleware;


  function middleware(req, res, next) {
    config.logger.debug('request.url:', req.url);

    if (match(req.url, config.templates)) {
      disableCache(req, res);
      tamperTemplate(req, res, next);
    } else if (match(req.url, config.moduleFile)) {
      if (!config.ngApp) {
        config.logger.error(
          'No ngApp provided: ' + config.ngApp
        );
        next();
        return;
      }
      config.matchedModuleFile = req.url;
      disableCache(req, res);
      tamperModule(req, res, next);
    } else if (match(req.url, config.angularFile)) {
      config.matchedAngularFile = req.url;
      disableCache(req, res);
      tamperAngular(req, res, next);
    } else {
      next();
    }
  }


  function wrapTemplate(req) {
    return function(body) {
      return fileChanger.wrapTemplate(body, req.url);
    };
  }


  function appendProvideGetter() {
    return function(body) {
      return fileChanger.appendProvideGetter(body, config.ngApp);
    };
  }


  function appendAngularModulePatch(req) {
    return function(body) {
      return fileChanger.appendAngularModulePatch(body, req.url);
    };
  }


  function disableCache(req, res) {
    req.headers['if-modified-since'] = undefined;
    req.headers['if-none-match'] = undefined;
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Expires', '-1');
    res.setHeader('Pragma', 'no-cache');
  }
}
