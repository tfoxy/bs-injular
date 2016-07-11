'use strict';
const minimatch = require('minimatch');

module.exports = match;


function match(string, patterns, opts) {
  if (!patterns) {
    return false;
  }

  if (Array.isArray(patterns)) {
    // Code from joshwnj/minimatch-all
    let match = false;

    patterns.forEach(function (pattern) {
      var isExclusion = pattern[0] === '!';

      // If we've got a match, only re-test for exclusions.
      // if we don't have a match, only re-test for inclusions.
      if (match !== isExclusion) { return; }

      match = minimatch(string, pattern, opts);
    });
    return match;
  } else {
    return minimatch(string, patterns, opts);
  }
}
