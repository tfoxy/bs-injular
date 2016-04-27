'use strict';

const expect = require('chai').expect;
const listenToFileChange = require('../lib/listenToFileChange');
const EventEmitter = require('events');
const immutable = require('immutable');
const sinon = require('sinon');
const mockFs = require('mock-fs');


describe('listenToFileChange', () => {
  let bs;

  beforeEach(() => {
    bs = {
      cwd: '/home/user/my-repo',
      emitter: new EventEmitter(),
      io: {sockets: new EventEmitter()},
      options: new immutable.Map()
    };
  });

  it('should add a file:changed listener', () => {
    expect(bs.emitter.listeners('file:changed')).to.have.length(0);
    listenToFileChange({}, bs);
    expect(bs.emitter.listeners('file:changed')).to.have.length(1);
  });

  it('should set its file:changed listener as the first one', () => {
    let listener = () => {/*noop*/};
    bs.emitter.on('file:changed', listener);
    listenToFileChange({}, bs);
    expect(bs.emitter.listeners('file:changed')).to.have.length(2);
    expect(bs.emitter.listeners('file:changed')).to.have.property('1', listener);
  });

  describe('listener', () => {
    let templateEvent;
    let controllerEvent;
    let config;

    beforeEach(() => {
      templateEvent = {
        path: '/home/user/my-repo/app/foo.html',
        event: 'file:changed'
      };
      controllerEvent = {
        path: '/home/user/my-repo/app/foo.controller.js',
        event: 'file:changed'
      };
      config = {
        emitNotify: sinon.spy(),
        logger: {
          error: sinon.spy()
        },
        templates: '/app/**/*.html',
        controllers: '/app/**/*.controller.js',
        moduleFile: '/app/foo.module.js',
        moduleName: 'app',
        matchedModuleFile: '/app/foo.module.js'
      };

      mockFs({
        '/home/user/my-repo/app': {
          'foo.html': '<div>BAR</div>',
          'foo.controller.js': 'angular.module("app").controller(function(){})'
        }
      });
    });

    afterEach(() => {
      mockFs.restore();
    });

    it('should not throw an error when no configuration is given', () => {
      listenToFileChange({}, bs);
      bs.emitter.emit('file:changed', templateEvent);
    });

    it('should emit "injularTemplate:changed" when changing a css file', () => {
      bs.options = bs.options.setIn(['server', 'baseDir'], '.');
      listenToFileChange(config, bs);
      sinon.spy(bs.io.sockets, 'emit');
      bs.emitter.emit('file:changed', templateEvent);
      expect(bs.io.sockets.emit).to.have.callCount(1)
        .and.to.have.been.calledWith('injularTemplate:changed');
    });

    it('should emit "injularScript:changed" when changing a js file', () => {
      bs.options = bs.options.setIn(['server', 'baseDir'], '.');
      listenToFileChange(config, bs);
      sinon.spy(bs.io.sockets, 'emit');
      bs.emitter.emit('file:changed', controllerEvent);
      expect(bs.io.sockets.emit).to.have.callCount(1)
        .and.to.have.been.calledWith('injularScript:changed');
    });

    it('should log error when changing a js file and no module file was matched', () => {
      bs.options = bs.options.setIn(['server', 'baseDir'], '.');
      delete config.matchedModuleFile;
      listenToFileChange(config, bs);
      bs.emitter.emit('file:changed', controllerEvent);
      expect(config.logger.error).to.have.callCount(1);
    });

    it('should not change data.event when changing a js file and no module file was matched', () => {
      bs.options = bs.options.setIn(['server', 'baseDir'], '.');
      delete config.matchedModuleFile;
      listenToFileChange(config, bs);
      bs.emitter.emit('file:changed', controllerEvent);
      expect(controllerEvent.event).to.equal('file:changed');
    });

  });

});
