'use strict';
const tamper = require('tamper');

const match = require('./match');
const fileChanger = require('./fileChanger');

module.exports = middlewareFactory;


function middlewareFactory(config) {
  const tamperTemplate = tamper(wrapTemplate);
  const tamperModule = tamper(appendProvideGetter);
  return middleware;


  function middleware(req, res, next) {
    if (match(req.url, config.templates)) {
      disableCache(req, res);
      tamperTemplate(req, res, next);
    } else if (match(req.url, config.moduleFile)) {
      if (!config.moduleName) {
        config.logger.error(
          'No moduleName provided: ' + config.moduleName
        );
        next();
        return;
      }
      config.moduleFileMatched = true;
      disableCache(req, res);
      tamperModule(req, res, next);
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
      return fileChanger.appendProvideGetter(body, config.moduleName);
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
