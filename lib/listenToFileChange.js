'use strict';
const fs = require('fs');
const path = require('path');

const match = require('./match');
const fileChanger = require('./fileChanger');

const FILE_CHANGED_EVENT = 'file:changed';
const TEMPLATE_CHANGED_EVENT = 'injularTemplate:changed';
const CONTROLLER_CHANGED_EVENT = 'injularController:changed';

module.exports = listenToFileChange;


function listenToFileChange(config, bs) {
  let oldListeners = bs.emitter.listeners(FILE_CHANGED_EVENT);
  bs.emitter.removeAllListeners(FILE_CHANGED_EVENT);
  bs.emitter.on(FILE_CHANGED_EVENT, fileChangedListener);
  oldListeners.forEach(listener => {
    bs.emitter.on(FILE_CHANGED_EVENT, listener);
  });
  
  let baseDirs = getBaseDirs(bs);


  function fileChangedListener(data) {
    let url;
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
    } else if (match(url, config.controllers)) {
      if (!wasModuleFileTampered(config)) {
        return;
      }
      data.event = '[BS Injular] DO NOT ' + data.event;
      let content = fs.readFileSync(data.path, 'utf8');
      bs.io.sockets.emit(CONTROLLER_CHANGED_EVENT, {
        fileContent: content
      });
      config.emitNotify({
        message: `Injected ${url}` 
      });
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
