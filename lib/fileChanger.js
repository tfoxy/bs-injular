'use strict';
module.exports = {
  wrapTemplate,
  appendProvideGetter,
  appendAngularDirectivePatch
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
    var bsInjular = window.___bsInjular___;
    if (!bsInjular) {
      bsInjular = window.___bsInjular___ = {};
    }
    bsInjular.$controllerProvider = $controllerProvider;
  }]);
})();
`;
}


function appendAngularDirectivePatch(body) {
  return body += `
;(function() {
  var bsInjular = window.___bsInjular___;
  if (!bsInjular) {
    bsInjular = window.___bsInjular___ = {};
  }
  bsInjular.directivesByUrl = {};
  var moduleFn = angular.module;
  angular.module = function bsInjularModule() {
    var module = moduleFn.apply(this, arguments);
    var directiveFn = module.directive;
    module.directive = function bsInjularAngularDirective(name, directiveFactory) {
      if (bsInjular.currentUrl) {
        // TODO patch directiveFactory
      }
      var module = directiveFn.call(this, name, directiveFactory);
      return module;
    };
    return module;
  };
})();
`;
}
