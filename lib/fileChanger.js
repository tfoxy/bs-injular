'use strict';

module.exports = {
  wrapTemplate,
  appendProvideGetter,
  appendAngularModulePatch,
  _appendAngularModulePatchFunction
};


function wrapTemplate(body, url, options) {
  options = options || {};
  // IE8 does not add bs-injular-start comment
  let ie8Content = '';
  if (options.supportIE8) {
    ie8Content = 
      `<!--[if lt IE 9]><b style="display:none!important" start-bs-injular="${url}"></b><![endif]-->`;
  }
  return `\
<!--bs-injular-start ${url}-->${ie8Content}\
${body}\
<!--bs-injular-end ${url}-->\
`;
}


function appendProvideGetter(body, moduleName, options) {
  options = options || {};
  let ie8Content = '';
  if (options.supportIE8) {
    ie8Content = `
  .directive('startBsInjular', function() {
    return {
      restrict: 'A',
      compile: compile
    };

    function compile(element, attrs) {
      var prev = element[0].previousSibling;
      if (prev && prev.nodeType === 8 && prev.data.lastIndexOf('bs-injular-start', 0) === 0) {
        element.remove();
      } else {
        element.replaceWith('<!--bs-injular-start ' + attrs.startBsInjular + '-->');
      }
    }
  })`;
  }
  let moduleNameString = moduleName ? JSON.stringify(moduleName) :
    `document.querySelector('[ng-app]').getAttribute('ng-app')`;
  return body += `
;(function() {
  angular.module(${moduleNameString})
  .config([
  '$controllerProvider', '$compileProvider', '$filterProvider',
  function($controllerProvider, $compileProvider, $filterProvider) {
    var bsInjular = window.___bsInjular___;
    if (!bsInjular) {
      bsInjular = window.___bsInjular___ = {};
    }
    bsInjular.$controllerProvider = $controllerProvider;
    bsInjular.$compileProvider = $compileProvider;
    bsInjular.$filterProvider = $filterProvider;
  }])${ie8Content};
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
    if (!module.___injular___) {
      directiveFn = module.directive;
      filterFn = module.filter;
      module.directive = bsInjularAngularDirective;
      module.filter = bsInjularFilterDirective;
      module.___injular___ = true;
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
      var src = currentScript.getAttribute('injular-src') || currentScript.src;
      var url = getPathname(src);
      if (!hasOwnProperty(bsInjular.directivesByUrl, url)) {
        bsInjular.directivesByUrl[url] = {};
      }
      var directivesByName = bsInjular.directivesByUrl[url];
      if (!hasOwnProperty(directivesByName, name)) {
        directiveList = directivesByName[name] = [];
      }
      var directiveList = directivesByName[name];
      var directive = directiveFactoryFn.apply(this, arguments);
      directive = instantiateDirective(directive, name);
      directiveList.push(directive);
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
    directive.require = directive.require || (directive.controller && directive.name);
    directive.restrict = directive.restrict || 'EA';
    return directive;
  }

  function valueFn(value) {
    return function() {
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
