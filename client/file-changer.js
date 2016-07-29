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
    wrapDirectiveFile: wrapDirectiveFile,
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
    return '<!--bs-injular-start ' + url + '-->' + ie8Content + body + '<!--bs-injular-end ' + url + '-->';
  }

  function wrapDirectiveFile(content, url) {
    var jsonUrl = JSON.stringify(url);
    return 'try{window.___bsInjular___.addScriptUrlToDirectives(' + jsonUrl + ');' + content + '\n}finally{window.___bsInjular___.currentDirectiveUrl = null};\n';
  }

  function appendProvideGetter(body, moduleName, options) {
    options = options || {};
    var ie8Content = '';
    if (options.supportIE8) {
      ie8Content = '\n  .directive(\'startBsInjular\', function() {\n    return {\n      restrict: \'A\',\n      compile: compile\n    };\n\n    function compile(element, attrs) {\n      var prev = element[0].previousSibling;\n      if (prev && prev.nodeType === 8 && prev.data.lastIndexOf(\'bs-injular-start\', 0) === 0) {\n        element.remove();\n      } else {\n        element.replaceWith(\'<!--bs-injular-start \' + attrs.startBsInjular + \'-->\');\n      }\n    }\n  })';
    }
    var moduleNameString = moduleName ? JSON.stringify(moduleName) : 'document.querySelector(\'[ng-app]\').getAttribute(\'ng-app\')';
    return body += '\n;(function() {\n  angular.module(' + moduleNameString + ')\n  .config([\n  \'$controllerProvider\', \'$compileProvider\', \'$filterProvider\',\n  function($controllerProvider, $compileProvider, $filterProvider) {\n    var bsInjular = window.___bsInjular___;\n    if (!bsInjular) {\n      bsInjular = window.___bsInjular___ = {};\n    }\n    bsInjular.$controllerProvider = $controllerProvider;\n    bsInjular.$compileProvider = $compileProvider;\n    bsInjular.$filterProvider = $filterProvider;\n  }])' + ie8Content + ';\n})();\n';
  }

  function appendAngularModulePatch(body) {
    return body += '\n;(' + _appendAngularModulePatchFunction + ')(angular, window);\n';
  }

  function _appendAngularModulePatchFunction(angular, window) {
    var bsInjular = window.___bsInjular___;
    if (!bsInjular) {
      bsInjular = window.___bsInjular___ = {};
    }
    bsInjular.directivesByUrl = {};
    bsInjular.filtersCache = {};
    bsInjular.addScriptUrlToDirectives = addScriptUrlToDirectives;

    var moduleFn = angular.module;
    angular.module = bsInjularModule;
    if (!('$$annotate' in angular.injector)) {
      angular.injector.$$annotate = angular.injector().annotate;
    }

    function bsInjularModule() {
      var directiveFn, filterFn;
      var module = moduleFn.apply(this, arguments);
      if (!module.___injular___) {
        module.___injular___ = true;
        directiveFn = module.directive;
        filterFn = module.filter;
        module.directive = bsInjularAngularDirective;
        module.filter = bsInjularFilterDirective;
      }
      return module;

      function bsInjularAngularDirective(name, directiveFactory) {
        var scriptUrl = bsInjular.currentDirectiveUrl;
        if (!scriptUrl) {
          // Do nothing special with this directive
        } else if (angular.isString(name)) {
          directiveFactory = patchDirectiveFactory(name, directiveFactory, scriptUrl);
        } else {
          angular.forEach(name, function (value, key) {
            name[key] = patchDirectiveFactory(key, value, scriptUrl);
          });
        }

        return directiveFn.call(this, name, directiveFactory);
      }

      function bsInjularFilterDirective(name, filterFactory) {
        if (angular.isString(name)) {
          filterFactory = patchFilterFactory(name, filterFactory);
        } else {
          angular.forEach(name, function (value, key) {
            name[key] = patchFilterFactory(key, value);
          });
        }

        return filterFn.call(this, name, filterFactory);
      }
    }

    function patchDirectiveFactory(name, directiveFactory, scriptUrl) {
      var directiveFactoryFn;
      if (angular.isArray(directiveFactory)) {
        directiveFactoryFn = directiveFactory[directiveFactory.length - 1];
      } else {
        directiveFactoryFn = directiveFactory;
      }

      var annotations = angular.injector.$$annotate(directiveFactory);
      annotations.push(function () {
        var directivesByName = bsInjular.directivesByUrl[scriptUrl];
        var directive = directiveFactoryFn.apply(this, arguments);
        if (directivesByName) {
          if (!hasOwnProperty(directivesByName, name)) {
            directiveList = directivesByName[name] = [];
          }
          var directiveList = directivesByName[name];
          directive = instantiateDirective(directive, name);
          directiveList.push(directive);
        }
        return directive;
      });
      return annotations;
    }

    function instantiateDirective(directive, name) {
      // Code from $compileProvider.directive
      if (angular.isFunction(directive)) {
        directive = { compile: valueFn(directive) };
      } else if (!directive.compile && directive.link) {
        directive.compile = valueFn(directive.link);
      }
      directive.priority = directive.priority || 0;
      directive.name = directive.name || name;
      directive.require = directive.require || directive.controller && directive.name;
      directive.restrict = directive.restrict || 'EA';
      return directive;
    }

    function valueFn(value) {
      return function () {
        return value;
      };
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

    function addScriptUrlToDirectives(url) {
      if (!hasOwnProperty(bsInjular.directivesByUrl, url)) {
        bsInjular.directivesByUrl[url] = {};
      }
      bsInjular.currentDirectiveUrl = url;
    }

    function hasOwnProperty(object, property) {
      return window.Object.prototype.hasOwnProperty.call(object, property);
    }
  }
});
