const extend = require('extend');


extend(Response.prototype, {
  setHeader,
  writeHead,
  write,
  end
});

module.exports = Response;

function Response() {
  this._headers = Object.create(null);
}

function setHeader(key, value) {
  this._headers[key] = value;
}

function writeHead() {
  // noop
}

function write() {
  // noop
}

function end(body) {
  this._body = body;
}
