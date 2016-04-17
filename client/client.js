
(function (bs) {
  'use strict';
  var TEMPLATE_CHANGED_EVENT = 'injularTemplate:changed';
  var CONTROLLER_CHANGED_EVENT = 'injularController:changed';

  var sockets = bs.socket;

  sockets.on(TEMPLATE_CHANGED_EVENT, templateChangedListener);
  sockets.on(CONTROLLER_CHANGED_EVENT, controllerChangedListener);


  function templateChangedListener(data) {
    try {
      tryTemplateChangedListener(data);
    } catch (err) {
      errorHandler(err);
    }
  }


  function controllerChangedListener(data) {
    try {
      var localAngular = getLocalAngular();
      var jsInjector = new Function('angular', data.fileContent);
      jsInjector(localAngular);

      var $injector = getInjector();
      reloadRoute($injector);
    } catch (err) {
      errorHandler(err);
    }
  }


  function getBsInjular() {
    var bsInjular = window.___bsInjular___;

    if (!bsInjular) {
      throwError(
        'Could not get window.___bsInjular___ . ' +
        'Are you sure the moduleName in the bsInjular options is correct?'
      );
    }

    return bsInjular;
  }


  function getLocalAngular() {
    var bsInjular = getBsInjular();

    if (!bsInjular.localAngular) {
      var $controllerProvider = bsInjular.$controllerProvider;
      if ($controllerProvider) {
        bsInjular.localAngular = createLocalAngular($controllerProvider);
      } else {
        throwError(
          'Could not get $controllerProvider. ' +
          'Are you sure the moduleName in the bsInjular options is correct?'
        );
      }
    }

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


  function tryTemplateChangedListener(data) {
    var $injector = getInjector();

    var $templateCache = $injector.get('$templateCache');
    var templateUrl = data.templateUrl;
    var template = data.template;
    replaceTemplateCache($templateCache, templateUrl, template);

    if (data.reloadRoute) {
      reloadRoute($injector);
    } else {
      var $compile = $injector.get('$compile');
      replaceTemplateInDom($compile, templateUrl, template);
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
  }


  function replaceTemplateInDom($compile, templateUrl, template) {
    var tw = createInjularCommentWalker(templateUrl);

    var node;
    while ((node = tw.nextNode())) {
      var templateNodes = getTemplateNodes(node, templateUrl);
      var templateElements = angular.element(templateNodes);
      var scope = templateElements.scope();

      scope.$apply(function() {
        var newTemplateElements = $compile(template)(scope);
        templateElements.replaceWith(newTemplateElements);
      });
    }
  }


  function getTemplateNodes(startingNode, templateUrl) {
    var nodes = [startingNode];

    var node = startingNode;
    while ((node = node.nextSibling)) {
      nodes.push(node);
      if (node.nodeType === Node.COMMENT_NODE &&
          node.textContent === 'bs-injular-end ' + templateUrl) {
        return nodes;
      }
    }

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
        if (node.nodeType === Node.COMMENT_NODE &&
            node.textContent === 'bs-injular-start ' + templateUrl) {
          return node;
        }
      }
      return node;
    }
  }


  function createTreeWalker(root) {
    var node = {childNodes: [root]};
    var stack = [];
    return {
      nextNode: nextNode
    };

    function nextNode() {
      if (!node) {
        return null;
      }

      var childNodes = node.childNodes;
      if (childNodes && childNodes.length) {
        if (node.nextSibling) {
          stack.push(node);
        }
        node = childNodes[0];
        return node;
      }

      node = stack.pop();
      if (!node) {
        return null;
      }

      node = node.nextSibling;
      return node;
    }
  }


  function createLocalAngular($controllerProvider) {
    var angular = getAngular();
    var localAngular = angular.copy(angular);
    var moduleFn = localAngular.module;
    localAngular.module = injularModule;
    return localAngular;

    function injularModule() {
      var app = moduleFn.apply(this, arguments);
      app = angular.copy(app);
      app.controller = injularControllerRecipe;
      return app;
    }

    function injularControllerRecipe() {
      $controllerProvider.register.apply($controllerProvider, arguments);
      return this;
    }
  }


  function errorHandler(err) {
    if (typeof err === 'string') {
      console.warn(err);
    } else {
      throw err;
    }
  }


  function throwError(msg) {
    throw '[BS-Injular] ' + msg;
  }
})(window.___browserSync___);
