'use strict';
module.exports = {
  wrapTemplate,
  appendProvideGetter
};


function wrapTemplate(body, url) {
  return `\
<!--bs-injular-start ${url}-->
${body}
<!--bs-injular-end ${url}-->\
`;
}


function appendProvideGetter(body, moduleName) {
  return body += `
;(function() {
  angular.module('${moduleName}')
  .config(['$controllerProvider', function($controllerProvider) {
    window.___bsInjular___ = {
      $controllerProvider: $controllerProvider
    };
  }]);
})();
`;
}
