const minimatch = require('minimatch');

module.exports = match;


function match(string, pattern) {
  return pattern && minimatch(string, pattern);
}
