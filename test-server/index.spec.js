'use strict';

const expect = require('chai').expect;
const bsInjular = require('..');
const browserSync = require('browser-sync');

describe('Injular plugin', () => {

  it('should run with BrowserSync `.use()`', function (done) {
    browserSync.reset();
    browserSync.use(bsInjular);
    browserSync({logLevel: 'silent'}, function (err, bs) {
      bs.cleanup();
      done(err);
    });
  });

  it('should run with BrowserSync as inline plugin', function (done) {
    browserSync.reset();
    var modulepath = process.cwd();
    browserSync({plugins: [modulepath], logLevel: 'silent'}, function (err, bs) {
      let plugins = bs.getUserPlugins();
      expect(plugins).to.have.length(1);
      expect(plugins[0]).to.have.property('name', 'Injular');
      expect(plugins[0]).to.have.property('active', true);
      bs.cleanup();
      done(err);
    });
  });

  it('should run with BrowserSync as inline plugin with options', function (done) {
    browserSync.reset();
    var modulepath = process.cwd();
    var plugin = {
      module: modulepath
    };
    browserSync({plugins: [plugin], logLevel: 'silent'}, function (err, bs) {
      let plugins = bs.getUserPlugins();
      expect(plugins).to.have.length(1);
      expect(plugins[0]).to.have.property('name', 'Injular');
      expect(plugins[0]).to.have.property('active', true);
      bs.cleanup();
      done(err);
    });
  });

  it('should run when UI is disabled', function (done) {
    browserSync.reset();
    var modulepath = process.cwd();
    var plugin = {
      module: modulepath
    };
    browserSync({
      plugins: [plugin],
      logLevel: 'silent',
      ui: false
    }, function (err, bs) {
      let plugins = bs.getUserPlugins();
      expect(plugins).to.have.length(1);
      expect(plugins[0]).to.have.property('name', 'Injular');
      expect(plugins[0]).to.have.property('active', true);
      bs.cleanup();
      done(err);
    });
  });

});