const minimatch = require('minimatch');

module.exports = match;


function match(string, pattern) {
  if (!pattern) {
    return false;
  }

  if (Array.isArray(pattern)) {
    return pattern.some(p => 
      minimatch(string, p)
    );
  } else {
    return minimatch(string, pattern);
  }
}
