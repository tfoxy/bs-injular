'use strict';
const sinon = require('sinon');
module.exports = createLogger;


function createLogger() {
  return {
    error: sinon.spy(),
    info: sinon.spy(),
    warn: sinon.spy(),
    debug: sinon.spy(),
    trace: sinon.spy()
  };
}
