'use strict';

module.exports = {
  wrapTemplate,
  appendProvideGetter,
  appendAngularModulePatch,
  _appendAngularModulePatchFunction
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


function appendAngularModulePatch(body) {
  return body += `
;(${_appendAngularModulePatchFunction})(angular, window, document);
`;
}


function _appendAngularModulePatchFunction(angular, window, document) {
  var bsInjular = window.___bsInjular___;
  if (!bsInjular) {
    bsInjular = window.___bsInjular___ = {};
  }
  bsInjular.directivesByUrl = Object.create(null);
  bsInjular.filtersCache = {};

  var moduleFn = angular.module;
  angular.module = bsInjularModule;

  function bsInjularModule() {
    var directiveFn, filterFn;
    var module = moduleFn.apply(this, arguments);
    if (arguments.length > 1) {
      directiveFn = module.directive;
      filterFn = module.filter;
      module.directive = bsInjularAngularDirective;
      module.filter = bsInjularFilterDirective;
    }
    return module;

    function bsInjularAngularDirective(name, directiveFactory) {
      var currentScript = document.currentScript || bsInjular.currentScript;
      if (!currentScript) {
        // TODO better warning
        /* eslint-disable no-console */
        console.warn('[BS-Injular] No currentScript for directive: ' + name);
        /* eslint-enable no-console */
      } else if (angular.isString(name)) {
        directiveFactory = patchDirectiveFactory(name, directiveFactory, currentScript);
      } else {
        angular.forEach(name, function(value, key) {
          name[key] = patchDirectiveFactory(key, value, currentScript);
        });
      }

      return directiveFn.call(this, name, directiveFactory);
    }

    function bsInjularFilterDirective(name, filterFactory) {
      if (angular.isString(name)) {
        filterFactory = patchFilterFactory(name, filterFactory);
      } else {
        angular.forEach(name, function(value, key) {
          name[key] = patchDirectiveFactory(key, value);
        });
      }

      return filterFn.call(this, name, filterFactory);
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

  function patchFilterFactory(name, filterFactory) {
    return function injularFilterFactory($injector) {
      var filter = $injector.invoke(filterFactory);
      bsInjular.filtersCache[name] = filter;
      return function injularFilter() {
        return bsInjular.filtersCache[name].apply(this, arguments);
      };
    };
  }

  function getPathname(url) {
    var anchor = document.createElement('a');
    anchor.href = url;
    return anchor.pathname;
  }

}
