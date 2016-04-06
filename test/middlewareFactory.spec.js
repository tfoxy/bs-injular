'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const middlewareFactory = require('../lib/middlewareFactory');
const Request = require('./Request');
const Response = require('./Response');

describe('middlewareFactory', () => {

  it('should return a function', () => {
    expect(middlewareFactory()).to.be.a('function');
  });

  describe('middleware', () => {

    it('should call next by default', () => {
      let middleware = middlewareFactory({});
      let req = new Request('/');
      let res = new Response();
      let next = sinon.spy();
      middleware(req, res, next);
      expect(next).to.have.callCount(1);
    });

    it('should tamper the template when matching the pattern', () => {
      let middleware = middlewareFactory({
        templates: '/app/**/*.html'
      });
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

    it('should tamper the module file when matching the pattern', () => {
      let middleware = middlewareFactory({
        moduleFile: '/app/index.module.js',
        moduleName: 'fooApp'
      });
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
      let errorLogger = sinon.spy();
      let middleware = middlewareFactory({
        moduleFile: '/app/index.module.js',
        logger: {error: errorLogger}
      });
      let req = new Request('/app/index.module.js');
      let res = new Response();
      let next = sinon.spy();
      middleware(req, res, next);
      expect(next).to.have.callCount(1);
      expect(errorLogger).to.have.callCount(1);
    });

    it('should not log an error when module name is given', () => {
      let errorLogger = sinon.spy();
      let middleware = middlewareFactory({
        moduleFile: '/app/index.module.js',
        moduleName: 'fooApp',
        logger: {error: errorLogger}
      });
      let req = new Request('/app/index.module.js');
      let res = new Response();
      let next = sinon.spy();
      middleware(req, res, next);
      expect(next).to.have.callCount(1);
      expect(errorLogger).to.have.callCount(0);
    });

  });

});
