'use strict';
const path = require('path');

module.exports = getUrlFromPathFunction;


function getUrlFromPathFunction(cwd, baseDirs) {
  cwd = cwd && path.normalize(cwd);
  baseDirs = baseDirs && baseDirs.map(function(dir) {
    return path.normalize(dir);
  });
  return getUrlFromPath;

  function getUrlFromPath(filepath) {
    let url = path.normalize(filepath);
    if (url.startsWith(cwd)) {
      let offset = url.charAt(cwd.length) === '/' ? 1 : 0;
      url = url.slice(cwd.length + offset);
    }
    baseDirs.some(dir => {
      if (url.startsWith(dir)) {
        url = url.slice(dir.length);
        return true;
      }
    });
    url = url.replace(/\\/g, '/');
    if (url.charAt(0) !== '/') url = '/' + url;
    return url;
  }
}
