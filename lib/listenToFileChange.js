'use strict';
const fs = require('fs');
const fileChanger = require('injular/lib/fileChanger');

const match = require('./match');
const getUrlFromPathFunction = require('./getUrlFromPathFunction');

const FILE_CHANGED_EVENT = 'file:changed';
const TEMPLATE_CHANGED_EVENT = 'injularTemplate:changed';
const SCRIPT_CHANGED_EVENT = 'injularScript:changed';

module.exports = listenToFileChange;


function listenToFileChange(config, bs) {
  const baseDirs = getBaseDirs(bs);
  config.logger.debug('cwd:', bs.cwd);
  config.logger.debug('optionBaseDir:', bs.options.getIn(['server', 'baseDir']));
  config.logger.debug('baseDirs:', baseDirs);
  const getUrlFromPath = getUrlFromPathFunction(bs.cwd, baseDirs);
  
  let oldListeners = bs.emitter.listeners(FILE_CHANGED_EVENT);
  bs.emitter.removeAllListeners(FILE_CHANGED_EVENT);
  bs.emitter.on(FILE_CHANGED_EVENT, fileChangedListener);
  oldListeners.forEach(listener => {
    bs.emitter.on(FILE_CHANGED_EVENT, listener);
  });


  function fileChangedListener(data) {
    /**
     * If the event property is undefined, infer that it's a 'change'
     * event due the fact this handler is for emitter.emit("file:changed")
     */
    if (typeof data.event === 'undefined') {
      data.event = 'change';
    }
    /**
     * Chokidar always sends an 'event' property - which could be
     * `add` `unlink` etc etc so we need to check for that and only
     * respond to 'change', for now.
     */
    if (data.event === 'change') {
      if (!bs.paused && data.namespace === 'core') {
        matchFile(data);
      }
    }
  }


  function matchFile(data) {
    config.logger.debug('fileChanged path:', data.path);
    let url = getUrlFromPath(data.path);
    config.logger.debug('fileChanged url:', url);

    if (match(url, config.templates)) {
      data.event = '[BS Injular] DO NOT ' + data.event;
      data.namespace = '[BS Injular] DISABLE ' + data.namespace;
      let content = fs.readFileSync(data.path, 'utf8');
      bs.io.sockets.emit(TEMPLATE_CHANGED_EVENT, {
        template: fileChanger.wrapTemplate(content, url, config),
        templateUrl: url,
        reloadRoute: config.reloadRouteOnTemplateInjection,
        avoidCleanScope: config.avoidCleanScope,
        logLevel: bs.options.get('logLevel')
      });
      config.emitNotify({
        message: `Injected ${url}` 
      });
    } else {
      let recipes = [];
      let controllerMatched = match(url, config.controllers);
      if (controllerMatched) recipes.push('controller');
      let directiveMatched = match(url, config.directives);
      if (directiveMatched) recipes.push('directive');
      let filterMatched = match(url, config.filters);
      if (filterMatched) recipes.push('filter');

      if (recipes.length) {
        if (!wasModuleFileTampered(config)) {
          return;
        }
        if ((directiveMatched || filterMatched) && !wasAngularFileTampered(config)) {
          return;
        }
        data.event = '[BS Injular] DO NOT ' + data.event;
        data.namespace = '[BS Injular] DISABLE ' + data.namespace;
        let content = fs.readFileSync(data.path, 'utf8');
        bs.io.sockets.emit(SCRIPT_CHANGED_EVENT, {
          script: content,
          scriptUrl: url,
          recipes: recipes,
          logLevel: bs.options.get('logLevel')
        });
        config.emitNotify({
          message: `Injected ${url}` 
        });
      }
    }
  }
}


function wasModuleFileTampered(config) {
  if (!config.moduleFile) {
    config.logger.error(
      'No moduleFile provided: ' + config.moduleFile
    );
    return false;
  }
  if (!config.matchedModuleFile) {
    config.logger.error(
      'No moduleFile was matched: ' + config.moduleFile
    );
    return false;
  }
  return true;
}


function wasAngularFileTampered(config) {
  if (!config.matchedAngularFile) {
    config.logger.error(
      'No angularFile was matched: ' + config.angularFile
    );
    return false;
  }
  return true;
}


function getBaseDirs(bs) {
  let optionBaseDir =
    bs.options.getIn(['server', 'baseDir']) ||
    bs.options.get('serveStatic');

  if (typeof optionBaseDir === 'string') {
    optionBaseDir = [optionBaseDir];
  } else if (optionBaseDir && optionBaseDir.toArray) {
    optionBaseDir = optionBaseDir.toArray();
  } else {
    optionBaseDir = [];
  }

  return optionBaseDir;
}
