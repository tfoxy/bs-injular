'use strict';
const fs = require('fs');
const path = require('path');

const match = require('./match');
const fileChanger = require('./fileChanger');

const FILE_CHANGED_EVENT = 'file:changed';
const TEMPLATE_CHANGED_EVENT = 'injularTemplate:changed';
const SCRIPT_CHANGED_EVENT = 'injularScript:changed';

module.exports = listenToFileChange;


function listenToFileChange(config, bs) {
  let oldListeners = bs.emitter.listeners(FILE_CHANGED_EVENT);
  bs.emitter.removeAllListeners(FILE_CHANGED_EVENT);
  bs.emitter.on(FILE_CHANGED_EVENT, fileChangedListener);
  oldListeners.forEach(listener => {
    bs.emitter.on(FILE_CHANGED_EVENT, listener);
  });
  
  let baseDirs = getBaseDirs(bs);
  config.logger.debug('cwd:', bs.cwd);
  config.logger.debug('optionBaseDir:', bs.options.getIn(['server', 'baseDir']));
  config.logger.debug('baseDirs:', baseDirs);


  function fileChangedListener(data) {
    let url;
    config.logger.debug('fileChanged path:', data.path);
    baseDirs.some(dir => {
      if (data.path.startsWith(dir)) {
        url = data.path.slice(dir.length);
        return true;
      }
    });

    if (!url) {
      return;
    }

    if (match(url, config.templates)) {
      data.event = '[BS Injular] DO NOT ' + data.event;
      let content = fs.readFileSync(data.path, 'utf8');
      bs.io.sockets.emit(TEMPLATE_CHANGED_EVENT, {
        template: fileChanger.wrapTemplate(content, url),
        templateUrl: url,
        reloadRoute: config.reloadRouteOnTemplateInjection
      });
      config.emitNotify({
        message: `Injected ${url}` 
      });
    } else {
      let controllerMatched = match(url, config.controllers);
      let directiveMatched = match(url, config.directives);
      let filterMatched = match(url, config.filters);

      if (controllerMatched || directiveMatched || filterMatched) {
        if (controllerMatched && !wasModuleFileTampered(config)) {
          return;
        }
        if (directiveMatched && !wasAngularFileTampered(config)) {
          return;
        }
        if (filterMatched && !wasAngularFileTampered(config)) {
          return;
        }
        data.event = '[BS Injular] DO NOT ' + data.event;
        let content = fs.readFileSync(data.path, 'utf8');
        bs.io.sockets.emit(SCRIPT_CHANGED_EVENT, {
          script: content,
          scriptUrl: url
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
  if (!config.moduleName) {
    config.logger.error(
      'No moduleName provided: ' + config.moduleName
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
  let cwd = bs.cwd;
  let optionBaseDir = bs.options.getIn(['server', 'baseDir']);

  if (typeof optionBaseDir === 'string') {
    optionBaseDir = [optionBaseDir];
  } else if (optionBaseDir && optionBaseDir.toArray) {
    optionBaseDir = optionBaseDir.toArray();
  } else {
    optionBaseDir = [];
  }

  return optionBaseDir.map(dir => {
    return path.join(cwd, dir);
  });
}
