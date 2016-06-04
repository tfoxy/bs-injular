(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod);
    global.fileChanger = mod.exports;
  }
})(this, function (module) {
  'use strict';

  module.exports = {
    wrapTemplate: wrapTemplate,
    appendProvideGetter: appendProvideGetter,
    appendAngularModulePatch: appendAngularModulePatch,
    _appendAngularModulePatchFunction: _appendAngularModulePatchFunction
  };

  function wrapTemplate(body, url, options) {
    options = options || {};
    // IE8 does not add bs-injular-start comment
    var ie8Content = '';
    if (options.supportIE8) {
      ie8Content = '<!--[if lt IE 9]><b style="display:none!important" start-bs-injular="' + url + '"></b><![endif]-->';
    }
    return '<!--bs-injular-start ' + url + '-->' + ie8Content + '\n' + body + '\n<!--bs-injular-end ' + url + '-->';
  }

  function appendProvideGetter(body, moduleName, options) {
    options = options || {};
    var ie8Content = '';
    if (options.supportIE8) {
      ie8Content = '\n  .directive(\'startBsInjular\', function() {\n    return {\n      restrict: \'A\',\n      compile: compile\n    };\n\n    function compile(element, attrs) {\n      console.log(\'COMPILE\')\n      var prev = element[0].previousSibling;\n      console.log(\'COMPILE \', prev)\n      if (prev && prev.nodeType === 8 && prev.data.lastIndexOf(\'bs-injular-start\', 0) === 0) {\n        console.log(\'REMOVE\')\n        element.remove();\n      } else {\n        console.log(\'REPLACE_WITH\')\n        element.replaceWith(\'<!--bs-injular-start \' + attrs.startBsInjular + \'-->\');\n      }\n      console.log(\'END_COMPILE\')\n    }\n  })';
    }
    var moduleNameString = JSON.stringify(moduleName);
    return body += '\n;(function() {\n  angular.module(' + moduleNameString + ')\n  .config([\n  \'$controllerProvider\', \'$compileProvider\', \'$filterProvider\',\n  function($controllerProvider, $compileProvider, $filterProvider) {\n    var bsInjular = window.___bsInjular___;\n    if (!bsInjular) {\n      bsInjular = window.___bsInjular___ = {};\n    }\n    bsInjular.$controllerProvider = $controllerProvider;\n    bsInjular.$compileProvider = $compileProvider;\n    bsInjular.$filterProvider = $filterProvider;\n  }])' + ie8Content + ';\n})();\n';
  }

  function appendAngularModulePatch(body) {
    return body += '\n;(' + _appendAngularModulePatchFunction + ')(angular, window, document);\n';
  }

  function _appendAngularModulePatchFunction(angular, window, document) {
    var bsInjular = window.___bsInjular___;
    if (!bsInjular) {
      bsInjular = window.___bsInjular___ = {};
    }
    bsInjular.directivesByUrl = {};
    bsInjular.filtersCache = {};

    var moduleFn = angular.module;
    angular.module = bsInjularModule;
    if (!('$$annotate' in angular.injector)) {
      angular.injector.$$annotate = angular.injector().annotate;
    }

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
        var currentScript = document.currentScript || alternativeCurrentScript();
        if (!currentScript) {
          // TODO better warning
          /* eslint-disable no-console */
          console.warn('[BS-Injular] No currentScript for directive: ' + name);
          /* eslint-enable no-console */
        } else if (angular.isString(name)) {
            directiveFactory = patchDirectiveFactory(name, directiveFactory, currentScript);
          } else {
            angular.forEach(name, function (value, key) {
              name[key] = patchDirectiveFactory(key, value, currentScript);
            });
          }

        return directiveFn.call(this, name, directiveFactory);
      }

      function bsInjularFilterDirective(name, filterFactory) {
        if (angular.isString(name)) {
          filterFactory = patchFilterFactory(name, filterFactory);
        } else {
          angular.forEach(name, function (value, key) {
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
      annotations.push(function () {
        var url = getPathname(currentScript.src);
        if (!hasOwnProperty(bsInjular.directivesByUrl, url)) {
          bsInjular.directivesByUrl[url] = {};
        }
        var directivesByName = bsInjular.directivesByUrl[url];
        if (!hasOwnProperty(directivesByName, name)) {
          directiveList = directivesByName[name] = [];
        }
        var directiveList = directivesByName[name];
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
      var pathname = anchor.pathname;
      // IE8 does not return the complete pathname
      if (pathname.charAt(0) !== '/') {
        pathname = '/' + pathname;
      }
      return pathname;
    }

    function alternativeCurrentScript() {
      var scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    }

    function hasOwnProperty(object, property) {
      return Object.prototype.hasOwnProperty.call(object, property);
    }
  }
});
