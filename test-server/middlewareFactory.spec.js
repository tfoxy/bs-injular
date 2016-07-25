'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const middlewareFactory = require('../lib/middlewareFactory');
const Request = require('./Request');
const Response = require('./Response');
const createLogger = require('./createLogger');


describe('middlewareFactory', () => {

  it('should return a function', () => {
    expect(middlewareFactory()).to.be.a('function');
  });

  describe('middleware', () => {
    let config;

    beforeEach(function() {
      config = {
        logger: createLogger()
      };
    });

    it('should call next by default', () => {
      let middleware = middlewareFactory(config);
      let req = new Request('/');
      let res = new Response();
      let next = sinon.spy();
      middleware(req, res, next);
      expect(next).to.have.callCount(1);
    });

    it('should tamper the template when matching the pattern', () => {
      config.templates = '/app/**/*.html';
      let middleware = middlewareFactory(config);
      let req = new Request('/app/foo.html');
      let res = new Response();
      let next = sinon.spy();
      middleware(req, res, next);
      expect(next).to.have.callCount(1);

      let body = '<div>FOO</div>';
      res.writeHead();
      res.end(body);
      expect(res._body).to.include(body);
      expect(res._body).to.not.startWith(body);
      expect(res._body).to.not.endWith(body);
    });

    it('should tamper the directive file when matching the pattern', () => {
      config.directives = '/app/**/*.directive.js';
      let middleware = middlewareFactory(config);
      let req = new Request('/app/foo.directive.js');
      let res = new Response();
      let next = sinon.spy();
      middleware(req, res, next);
      expect(next).to.have.callCount(1);

      let body = `(function(){'foo'})`;
      res.writeHead();
      res.end(body);
      expect(res._body).to.include(body);
      expect(res._body).to.not.equal(body);
    });

    it('should tamper the module file when matching the pattern', () => {
      config.moduleFile = '/app/index.module.js';
      config.ngApp = 'fooApp';
      let middleware = middlewareFactory(config);
      let req = new Request('/app/index.module.js');
      let res = new Response();
      let next = sinon.spy();
      middleware(req, res, next);
      expect(next).to.have.callCount(1);

      let body = 'angular.module("fooApp", [])';
      res.writeHead();
      res.end(body);
      expect(res._body).to.include(body);
      expect(res._body).to.startWith(body);
      expect(res._body).to.not.endWith(body);
    });

    it('should log an error when no module name is given', () => {
      config.moduleFile = '/app/index.module.js';
      let middleware = middlewareFactory(config);
      let req = new Request('/app/index.module.js');
      let res = new Response();
      let next = sinon.spy();
      middleware(req, res, next);
      expect(next).to.have.callCount(1);
      expect(config.logger.error).to.have.callCount(1);
    });

    it('should not log an error when module name is given', () => {
      config.moduleFile = '/app/index.module.js';
      config.ngApp = 'fooApp';
      let middleware = middlewareFactory(config);
      let req = new Request('/app/index.module.js');
      let res = new Response();
      let next = sinon.spy();
      middleware(req, res, next);
      expect(next).to.have.callCount(1);
      expect(config.logger.error).to.have.callCount(0);
    });

  });

});
