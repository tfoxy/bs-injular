'use strict';
/* global angular, window, document */

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
  var moduleNameString = JSON.stringify(moduleName);
  return body += `
;(function() {
  angular.module(${moduleNameString})
  .config(['$controllerProvider', '$compileProvider', function($controllerProvider, $compileProvider) {
    var bsInjular = window.___bsInjular___;
    if (!bsInjular) {
      bsInjular = window.___bsInjular___ = {};
    }
    bsInjular.$controllerProvider = $controllerProvider;
    bsInjular.$compileProvider = $compileProvider;
  }]);
})();
`;
}


function appendAngularDirectivePatch(body) {
  return body += `
;(${appendAngularDirectivePatchFunction})();
`;
}

/* eslint-disable no-console */
var appendAngularDirectivePatchFunction = function() {
  var bsInjular = window.___bsInjular___;
  if (!bsInjular) {
    bsInjular = window.___bsInjular___ = {};
  }
  bsInjular.directivesByUrl = Object.create(null);

  var moduleFn = angular.module;
  angular.module = bsInjularModule;

  function bsInjularModule() {
    var module = moduleFn.apply(this, arguments);
    var directiveFn = module.directive;
    module.directive = bsInjularAngularDirective;
    return module;

    function bsInjularAngularDirective(name, directiveFactory) {
      var currentScript = document.currentScript || bsInjular.currentScript;
      if (!currentScript) {
        // TODO better warning
        console.warn('[BS-Injular] No currentScript for directive: ' + name);
      } else if (angular.isString(name)) {
        directiveFactory = patchDirectiveFactory(name, directiveFactory, currentScript);
      } else {
        angular.forEach(name, function(value, key) {
          name[key] = patchDirectiveFactory(key, value, currentScript);
        });
      }

      return directiveFn.call(this, name, directiveFactory);
    }
  }

  function patchDirectiveFactory(name, directiveFactory, currentScript) {
    var directiveFactoryFn;
    if (angular.isArray(directiveFactory)) {
      directiveFactoryFn = directiveFactory[directiveFactory.length - 1];
    } else {
      directiveFactoryFn = directiveFactory;
    }

    var annotations = angular.injector.$$annotate(directiveFactory);
    annotations.push(function() {
      var url = getPathname(currentScript.src);
      var directivesByName = bsInjular.directivesByUrl[url];
      if (!directivesByName) {
        directivesByName = bsInjular.directivesByUrl[url] = Object.create(null);
      }
      var directiveList = directivesByName[name];
      if (!directiveList) {
        directiveList = directivesByName[name] = [];
      }
      var directive = directiveFactoryFn.apply(this, arguments);
      directiveList.push(directive);
      return directive;
    });
    return annotations;
  }

  function getPathname(url) {
    var anchor = document.createElement('a');
    anchor.href = url;
    return anchor.pathname;
  }

};
