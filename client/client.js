
(function (bs) {
  'use strict';
  var TEMPLATE_CHANGED_EVENT = 'injularTemplate:changed';
  var SCRIPT_CHANGED_EVENT = 'injularScript:changed';
  var DIRECTIVE_SUFFIX = 'Directive';
  // Node.COMMENT_NODE === 8 . IE8 does not implement the Node interface
  var COMMENT_NODE = 8;

  var logger = createLogger();
  var sockets = bs.socket;

  sockets.on(TEMPLATE_CHANGED_EVENT, templateChangedListener);
  sockets.on(SCRIPT_CHANGED_EVENT, scriptChangedListener);


  function templateChangedListener(data) {
    setLoggerPriority(data.logLevel);
    logger.debug('templateChangedListener', data);
    
    var $injector = getInjector();

    var $templateCache = $injector.get('$templateCache');
    var templateUrl = data.templateUrl;
    var template = data.template;
    replaceTemplateCache($templateCache, templateUrl, template);

    if (data.reloadRoute) {
      reloadRoute($injector);
    } else {
      replaceTemplateInDom($injector, templateUrl, template);
    }
  }


  function scriptChangedListener(data) {
    setLoggerPriority(data.logLevel);
    logger.debug('scriptChangedListener', data);
    
    var $injector = getInjector();

    var localAngular = getLocalAngular($injector);
    localAngular._scriptUrl = data.scriptUrl;
    var jsInjector = new Function('angular', data.script);
    jsInjector(localAngular);
    if (data.recipes.indexOf('directive') >= 0) {
      removeDeletedDirectives($injector, data.scriptUrl);
    }

    reloadRoute($injector);
  }


  function getBsInjular() {
    var bsInjular = window.___bsInjular___;

    if (!bsInjular) {
      throwError(
        'Could not get window.___bsInjular___ . ' +
        'Are you sure ngApp property in bsInjular options is correct?'
      );
    }

    return bsInjular;
  }


  function removeDeletedDirectives($injector, scriptUrl) {
    if (!scriptUrl) {
      return;
    }
    var bsInjular = getBsInjular();
    var indexByDirectiveName = bsInjular.indexByDirectiveName;
    var directivesByUrl = bsInjular.directivesByUrl;
    if (!directivesByUrl) {
      return;
    }

    if (hasOwnProperty(directivesByUrl, scriptUrl)) {
      var directivesByName = directivesByUrl[scriptUrl];
      for (var name in directivesByName) {
        if (hasOwnProperty(directivesByName, name)) {
          var removeStartIndex = indexByDirectiveName[name] || 0;
          var directiveList = directivesByName[name].slice(removeStartIndex);
          if (directiveList.length) {
            var moduleDirectives = $injector.get(name + DIRECTIVE_SUFFIX);
            angular.forEach(directiveList, function(directive) {
              var index = moduleDirectives.indexOf(directive);
              if (index >= 0) {
                moduleDirectives.splice(index, 1);
              }
            });
          }
        }
      }
    } else {
      logger.error('No directives for url:', scriptUrl);
    }
  }


  function getLocalAngular($injector) {
    var bsInjular = getBsInjular();

    if (!bsInjular.localAngular) {
      bsInjular.localAngular = createLocalAngular(bsInjular, $injector);
    }
    bsInjular.indexByDirectiveName = {};

    return bsInjular.localAngular;
  }


  function reloadRoute($injector) {
    if ($injector.has('$state')) {
      $injector.get('$state').reload();
    } else if ($injector.has('$route')) {
      $injector.get('$route').reload();
    } else {
      throwError(
        'Cannot reload route because ' +
        'neither $state nor $route are present in $injector'
      );
    }
  }


  function getAngular() {
    var angular = window.angular;

    if (!angular) {
      throwError('Can\'t find window.angular');
    }

    return angular;
  }


  function getAppElement() {
    if (!document.querySelector) {
      throwError('Can\'t find document.querySelector');
    }

    var elem = document.querySelector('[ng-app]');

    if (!elem) {
      throwError('Can\'t find [ng-app] element');
    }

    return elem;
  }


  function getInjector() {
    var angular = getAngular();
    var elem = getAppElement();
    var $injector = angular.element(elem).injector();

    if (!$injector) {
      throwError('Can\'t find $injector in [ng-app] element');
    }

    return $injector;
  }


  function replaceTemplateCache($templateCache, templateUrl, template) {
    var cacheUrls = [];
    var cacheUrl = templateUrl;
    cacheUrls.push(cacheUrl);
    var cache = $templateCache.get(cacheUrl);

    if (!cache && templateUrl.charAt(0) === '/') {
      cacheUrl = templateUrl.slice(1);
      cacheUrls.push(cacheUrl);
      cache = $templateCache.get(cacheUrl);
    }

    if (!cache && templateUrl.lastIndexOf(location.pathname, 0) === 0) {
      cacheUrl = templateUrl.slice(location.pathname.length);
      cacheUrls.push(cacheUrl);
      cache = $templateCache.get(cacheUrl);
    }

    if (!cache) {
      throwError('Can\'t find templateCache of any of the following urls: ' + cacheUrls);
    }

    $templateCache.remove(cacheUrl);
    $templateCache.put(cacheUrl, template);
    logger.debug('Template cache replaced:', cacheUrl);
  }


  function replaceTemplateInDom($injector, templateUrl, template) {
    var tw = createInjularCommentWalker(templateUrl);
    var $compile = $injector.get('$compile');
    var $rootScope = $injector.get('$rootScope');

    var node;
    while ((node = tw.nextNode())) {
      var templateNodes = getTemplateNodes(node, templateUrl, $injector);
      var templateElements = angular.element(templateNodes);
      var scope = templateElements.scope().$new();
      var templateFunction = $compile(template);

      logger.debug('Applying template with scope:', scope, ' ; replacing:', templateElements);

      $rootScope.$apply(function() {
        var newTemplateElements = templateFunction(scope);
        templateElements.replaceWith(newTemplateElements);
        logger.debug('Template applied:', templateUrl);
      });
    }
  }


  function getTemplateNodes(startingNode, templateUrl, $injector) {
    var nodes = [startingNode];

    var node = startingNode;
    while ((node = node.nextSibling)) {
      nodes.push(node);

      if (node.nodeType === COMMENT_NODE &&
          node.data === 'bs-injular-end ' + templateUrl) {
        return nodes;
      }
    }

    logger.info('bs-injular-end not found. Reloading route.');
    reloadRoute($injector);
    throwError('Can\'t find ending comment node: bs-injular-end ' + templateUrl);
  }


  function createInjularCommentWalker(templateUrl) {
    var tw, node;
    var root = getAppElement();

    if (document.createTreeWalker) {
      tw = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT, null, null);
    } else {
      // for IE8
      tw = createTreeWalker(root);
    }

    return {
      nextNode: nextNode
    };

    function nextNode() {
      while ((node = tw.nextNode())) {
        if ((
            node.nodeType === COMMENT_NODE &&
            node.data === 'bs-injular-start ' + templateUrl
            ) || (
            node.nodeType === 1 &&
            node.getAttribute('bs-injular-start') === templateUrl)
            ) {
          return node;
        }
      }
      return node;
    }
  }


  function createTreeWalker(root) {
    var node = root;
    var stack = [];
    return {
      nextNode: nextNode
    };

    function nextNode() {
      if (!node) return null;

      var childNodes = node.childNodes;
      if (childNodes && childNodes.length) {
        if (node.nextSibling) {
          stack.push(node);
        }
        node = childNodes[0];
        return node;
      }

      node = node.nextSibling;
      if (node) return node;

      node = stack.pop();
      if (!node) return null;

      node = node.nextSibling;
      return node;
    }
  }


  function createLocalAngular(bsInjular, $injector) {
    var angular = getAngular();
    var localAngular = angular.copy(angular);
    var moduleFn = localAngular.module;
    localAngular.module = injularModule;
    return localAngular;

    function injularModule() {
      var app = moduleFn.apply(this, arguments);
      app = angular.copy(app);
      app.controller = injularControllerRecipe;
      app.directive = injularDirectiveRecipe;
      if ('component' in app) {
        if ('$compileProvider' in bsInjular) {
          app.component = getCompileProvider().component.bind(app);
        } else {
          app.component = getCompileProvider;
        }
      }
      app.filter = injularFilterRecipe;
      app.config = returnSelf;
      app.run = returnSelf;
      app.constant = returnSelf;
      app.value = returnSelf;
      app.provider = returnSelf;
      app.factory = returnSelf;
      app.service = returnSelf;
      return app;
    }

    function returnSelf() {
      return this;
    }

    function injularControllerRecipe() {
      if (!bsInjular.$controllerProvider) {
        throwError(
          'Could not get $controllerProvider. ' +
          'Are you sure ngApp property in bsInjular options is correct?'
        );
      }
      bsInjular.$controllerProvider.register.apply(bsInjular.$controllerProvider, arguments);
      return this;
    }

    function injularFilterRecipe(name, filterFactory) {
      var filtersCache = bsInjular.filtersCache;
      if (!filtersCache) {
        throwError(
          'Could not get filtersCache. ' +
          'Are you sure angularFile property in bsInjular options is correct?'
        );
      }

      if (hasOwnProperty(bsInjular.filtersCache, name)) {
        bsInjular.filtersCache[name] = $injector.invoke(filterFactory);
      } else {
        var $filterProvider = bsInjular.$filterProvider;
        if (!$filterProvider) {
          throwError(
            'Could not get $filterProvider. ' +
            'Are you sure ngApp property in bsInjular options is correct?'
          );
        }
        $filterProvider.register.apply($filterProvider, arguments);
      }
      return this;
    }

    function injularDirectiveRecipe(name, directiveFactory) {
      var directivesByUrl = bsInjular.directivesByUrl;
      if (!directivesByUrl) {
        throwError(
          'Could not get directivesByUrl. ' +
          'Are you sure angularFile property in bsInjular options is correct?'
        );
      }


      if (hasOwnProperty(directivesByUrl, localAngular._scriptUrl)) {
        var directivesByName = directivesByUrl[localAngular._scriptUrl];
        if (angular.isString(name)) {
          injectDirective(name, directiveFactory, directivesByName);
        } else {
          angular.forEach(name, function(directiveFactory, name) {
            injectDirective(name, directiveFactory, directivesByName);
          });
        }
      } else {
        logger.error('No directives for url:', localAngular._scriptUrl);
      }

      return this;
    }

    function injectDirective(name, directiveFactory, directivesByName) {
      var directiveList = directivesByName[name];

      if (!hasOwnProperty(bsInjular.indexByDirectiveName, name)) {
        bsInjular.indexByDirectiveName[name] = 0;
      }
      var index = bsInjular.indexByDirectiveName[name]++;

      if (hasOwnProperty(directivesByName, name)) {
        if (index < directiveList.length) {
          var directive = directiveList[index];
          var newDirective = instantiateDirective($injector, directiveFactory, name);
          removeReplaceableDirectiveProperties(directive);
          angular.extend(directive, newDirective);
          return this;
        }
      } else {
        directiveList = directivesByName[name] = [];
      }

      // create directive if it does not exists

      var $compileProvider = getCompileProvider();
      $compileProvider.directive(name, directiveFactory);
      var directives = $injector.get(name + DIRECTIVE_SUFFIX);
      directiveList.push(directives[directives.length - 1]);
      bsInjular.indexByDirectiveName[name]++;
    }

    function getCompileProvider() {
      var $compileProvider = bsInjular.$compileProvider;
      if (!$compileProvider) {
        throwError(
          'Could not get $compileProvider. ' +
          'Are you sure ngApp property in the bsInjular options is correct?'
        );
      }
      return $compileProvider;
    }
  }


  function instantiateDirective($injector, directiveFactory, name) {
    // Code from $compileProvider.directive
    var directive = $injector.invoke(directiveFactory);
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


  function removeReplaceableDirectiveProperties(directive) {
    for (var key in directive) {
      if (key !== 'index' && key !== '$$moduleName') {
        delete directive[key];
      }
    }
  }


  function valueFn(value) {
    return function() {
      return value;
    };
  }


  function throwError(msg) {
    throw new Error('[BS-Injular] ' + msg);
  }


  function hasOwnProperty(object, property) {
    return Object.prototype.hasOwnProperty.call(object, property);
  }


  function createLogger() {
    var logLevels = {
      'trace': 100,
      'debug': 200,
      'warn':  300,
      'info':  400,
      'error': 500,
      'silent': 9001
    };
    var logger = {
      logLevels: logLevels,
      priority: logLevels['info']
    };

    for (var logLevel in logLevels) {
      logger[logLevel] = logFn(logLevel);
    }

    return logger;


    function logFn(logLevel) {
      var logLevelPriority = logLevels[logLevel];
      return log;

      function log() {
        if (logger.priority <= logLevelPriority) {
          Array.prototype.unshift.call(arguments, '[BS-Injular]');
          (console[logLevels[logLevel]] || console.log).apply(console, arguments);
        }
      }
    }
  }


  function setLoggerPriority(logLevel) {
    if (typeof logLevel === 'undefined') return;
    
    logger.priority = logger.logLevels[logLevel] || logLevel;
  }
})(window.___browserSync___);
