
(function (bs) {
  'use strict';
  var TEMPLATE_CHANGED_EVENT = 'injularTemplate:changed';
  var CONTROLLER_CHANGED_EVENT = 'injularController:changed';

  var sockets = bs.socket;
  var bsInjular, localAngular;

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
      initializeLocalAngular();
      var jsInjector = new Function('angular', data.fileContent);
      jsInjector(localAngular);

      var $injector = getInjector();
      reloadRoute($injector);
    } catch (err) {
      errorHandler(err);
    }
  }


  function initializeBsInjular() {
    var ___bsInjular___ = window.___bsInjular___;
    if (___bsInjular___) {
      bsInjular = ___bsInjular___;
    }
  }


  function initializeLocalAngular() {
    if (localAngular) {
      return;
    }

    initializeBsInjular();

    if (bsInjular && bsInjular.$controllerProvider) {
      localAngular = createLocalAngular();
    } else {
      throwError(
        'Could not get $controllerProvider. ' +
        'Are you sure the moduleName is correct?'
      );
    }
  }


  function reloadRoute($injector) {
    if ($injector.has('$state')) {
      $injector.get('$state').reload();
    } else if ($injector.has('$route')) {
      $injector.get('$route').reload();
    } else {
      throwError(
        'Cannot reload controller because ' +
        'neither $state nor $route are present in $injector'
      );
    }
  }


  function tryTemplateChangedListener(data) {
    validateAngularExistance();

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


  function validateAngularExistance() {
    if (!window.angular) {
      throwError('Can\'t find window.angular');
    }
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
    return angular.element(elem).injector();
  }


  function replaceTemplateCache($templateCache, templateUrl, template) {
    var cacheUrl = templateUrl;
    var cache = $templateCache.get(cacheUrl);

    if (!cache && templateUrl.charAt(0) === '/') {
      cacheUrl = templateUrl.slice(1);
      cache = $templateCache.get(cacheUrl);
    }

    if (!cache && templateUrl.lastIndexOf(location.pathname, 0) === 0) {
      cacheUrl = templateUrl.slice(location.pathname.length);
      cache = $templateCache.get(cacheUrl);
    }

    if (!cache) {
      throwError('Can\'t find template ' + templateUrl);
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

    if (document.createTreeWalker) {
      tw = document.createTreeWalker(document, NodeFilter.SHOW_COMMENT, null, null);
    } else {
      // for IE8
      tw = createTreeWalker();
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


  function createTreeWalker() {
    var node = {childNodes: [document.documentElement]};
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


  function createLocalAngular() {
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
      var $controllerProvider = bsInjular.$controllerProvider;
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
