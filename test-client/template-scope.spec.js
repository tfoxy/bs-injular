'use strict';

describe('template changed listener (scope)', function() {
  var VERSION_MINOR = angular.version.minor;
  var CHECK_WATCHERS_COUNT = VERSION_MINOR >= 4;
  var TEMPLATE_CHANGED_EVENT = 'injularTemplate:changed';
  var ngApp = 'app';
  var bs = window.___browserSync___;
  var listener = bs.__events[TEMPLATE_CHANGED_EVENT];
  var rootElement;

  before(function() {
    var body = angular.element(document.body);
    rootElement = angular.element('<div></div>');
    body.append(rootElement);
  });

  afterEach(function() {
    rootElement.children().remove();
  });

  after(function() {
    rootElement.remove();
  });

  it('should preserve the form of a scope', function() {
    var template = [
      '<!--bs-injular-start /app/foo.html-->',
      '<form name="fooForm">FOO</form>',
      '<!--bs-injular-end /app/foo.html-->'
    ].join('');
    var element = angular.element([
      '<div ng-app="'+ngApp+'">',
      template,
      '</div>'
    ].join(''));
    rootElement.append(element);
    angular.bootstrap(element);
    element.injector().get('$templateCache').put('/app/foo.html', template);

    expect(element.find('form').scope())
    .to.have.deep.property('fooForm.$error');

    listener({
      template: template,
      templateUrl: '/app/foo.html'
    });

    expect(element.find('form').scope())
    .to.have.property('fooForm')
    .that.is.an('object');
  });


  it('should preserve a parent controller binding and replace the template binding', function() {
    var template = [
      '<!--bs-injular-start /app/foo.html-->',
      '<b ng-controller="Bar"></b>',
      '<!--bs-injular-end /app/foo.html-->'
    ].join('');
    var element = angular.element([
      '<div ng-app="'+ngApp+'">',
      '<i ng-controller="Foo">',
      template,
      '</i>',
      '</div>'
    ].join(''));
    rootElement.append(element);
    angular.bootstrap(element, [ngApp, registerControllers]);
    element.injector().get('$templateCache').put('/app/foo.html', template);

    expect(element.find('i').scope()).to.have.property('foo', 'foo1');
    expect(element.find('b').scope()).to.have.property('bar', 'bar1');
    expect(element.find('b').scope()).to.have.property('fooAux', 'foo1');

    listener({
      template: template,
      templateUrl: '/app/foo.html'
    });

    expect(element.find('i').scope()).to.have.property('foo', 'foo1');
    expect(element.find('b').scope()).to.have.property('bar').that.not.equals('bar1');
    expect(element.find('b').scope()).to.have.property('fooAux', 'foo1');


    function registerControllers($controllerProvider) {
      var i = 0, j = 0;
      $controllerProvider.register('Foo', function($scope) {
        i++;
        $scope.foo = 'foo' + i;
      });
      $controllerProvider.register('Bar', function($scope) {
        j++;
        $scope.bar = 'bar' + j;
        $scope.fooAux = $scope.foo;
      });
    }
  });


  it('should preserve the scope of a directive template', function() {
    var template = [
      '<!--bs-injular-start /app/foo.html-->',
      '<div>{{foo}}</div>',
      '<!--bs-injular-end /app/foo.html-->'
    ].join('');
    var element = angular.element([
      '<div ng-app="'+ngApp+'">',
      '<div foo></div>',
      '</div>'
    ].join(''));
    rootElement.append(element);
    angular.bootstrap(element, [ngApp, provideDirective]);

    expect(element.text()).to.equal('bar');

    var newTemplate = [
      '<!--bs-injular-start /app/foo.html-->',
      '<div>FOO{{foo}}</div>',
      '<!--bs-injular-end /app/foo.html-->'
    ].join('');
    listener({
      template: newTemplate,
      templateUrl: '/app/foo.html'
    });

    expect(element.text()).to.equal('FOObar');


    function provideDirective($compileProvider) {
      $compileProvider.directive('foo', function($templateCache) {
        $templateCache.put('/app/foo.html', template);
        return {
          restrict: 'A',
          templateUrl: '/app/foo.html',
          scope: {},
          controller: function($scope) {
            $scope.foo = 'bar';
          }
        };
      });
    }
  });


  it('should add template to dom before applying scope', function() {
    var template = [
      '<!--bs-injular-start /app/foo.html-->',
      '<div foo>FOO</div>',
      '<div bar>BAR</div>',
      '<!--bs-injular-end /app/foo.html-->'
    ].join('');
    var element = angular.element([
      '<div ng-app="'+ngApp+'">',
      template,
      '</div>'
    ].join(''));
    rootElement.append(element);
    angular.bootstrap(element, [ngApp, provideDirective]);
    element.injector().get('$templateCache').put('/app/foo.html', template);

    listener({
      template: template,
      templateUrl: '/app/foo.html'
    });

    expect(element.text()).to.equal('BAR');


    function provideDirective($compileProvider) {
      $compileProvider.directive('foo', function() {
        return {
          restrict: 'A',
          compile: function(element) {
            element.remove();
          }
        };
      });
    }
  });


  it('should preserve the template scope', function() {
    var template = [
      '<!--bs-injular-start /app/foo.html-->',
      '<input ng-model="foo">',
      '<!--bs-injular-end /app/foo.html-->'
    ].join('');
    var element = angular.element([
      '<div ng-app="'+ngApp+'">',
      '<div foo></div>',
      '</div>'
    ].join(''));
    rootElement.append(element);
    angular.bootstrap(element, [ngApp, provideDirective]);
    element.find('input').controller('ngModel').$setViewValue('bar');

    listener({
      template: template,
      templateUrl: '/app/foo.html'
    });

    expect(element.find('input').scope()).to.have.property('foo', 'bar');
    expect(element.find('input').controller('ngModel').$viewValue).to.equal('bar');


    function provideDirective($compileProvider) {
      $compileProvider.directive('foo', function($templateCache) {
        $templateCache.put('/app/foo.html', template);
        return {
          restrict: 'A',
          scope: {},
          templateUrl: '/app/foo.html'
        };
      });
    }
  });


  it('should preserve directive watchers', function() {
    var template = [
      '<!--bs-injular-start /app/foo.html-->',
      '<div></div>',
      '<!--bs-injular-end /app/foo.html-->'
    ].join('');
    var element = angular.element([
      '<div ng-app="'+ngApp+'">',
      '<div foo></div>',
      '</div>'
    ].join(''));
    rootElement.append(element);
    angular.bootstrap(element, [ngApp, provideDirective]);
    element.injector().get('$templateCache').put('/app/foo.html', template);

    var $rootScope = element.injector().get('$rootScope');
    expect($rootScope.$$watchers.length).to.equal(1, 'beforeInjection $rootScope.$$watchers.length');
    if (CHECK_WATCHERS_COUNT) {
      expect($rootScope.$$watchersCount).to.equal(1, 'beforeInjection $rootScope.$$watchersCount');
    }

    listener({
      template: template,
      templateUrl: '/app/foo.html'
    });

    expect($rootScope.$$watchers.length).to.equal(1, 'afterInjection $rootScope.$$watchers.length');
    if (CHECK_WATCHERS_COUNT) {
      expect($rootScope.$$watchersCount).to.equal(1, 'afterInjection $rootScope.$$watchersCount');
    }


    function provideDirective($compileProvider) {
      $compileProvider.directive('foo', function($templateCache) {
        $templateCache.put('/app/foo.html', template);
        return {
          restrict: 'A',
          templateUrl: '/app/foo.html',
          link: function(scope) {
            scope.$watch('foo', function(val) {
              scope.bar = val;
            });
          }
        };
      });
    }
  });


  it('should destroy child scopes', function() {
    var template = [
      '<!--bs-injular-start /app/foo.html-->',
      '<div ng-if="true">',
      '<input ng-model="foo">',
      '<input ng-model="bar">',
      '</div>',
      '<!--bs-injular-end /app/foo.html-->'
    ].join('');
    var element = angular.element([
      '<div ng-app="'+ngApp+'">',
      template,
      '</div>'
    ].join(''));
    rootElement.append(element);
    angular.bootstrap(element);
    element.injector().get('$templateCache').put('/app/foo.html', template);

    var $rootScope = element.injector().get('$rootScope');
    if (CHECK_WATCHERS_COUNT) {
      expect($rootScope.$$watchersCount).to.equal(2, 'beforeInjection $rootScope.$$watchersCount');
    }
    expect($rootScope.$$childHead).to.equal($rootScope.$$childTail, 'beforeInjection $rootScope.$$childHead == $rootScope.$$childTail');

    listener({
      template: template,
      templateUrl: '/app/foo.html'
    });

    if (CHECK_WATCHERS_COUNT) {
      expect($rootScope.$$watchersCount).to.equal(2, 'afterInjection $rootScope.$$watchersCount');
    }
    expect($rootScope.$$childHead).to.equal($rootScope.$$childTail, 'afterInjection $rootScope.$$childHead == $rootScope.$$childTail');
  });


  angular.forEach([
    { name: 'binding', template: '{{foo}}' },
    { name: 'multiple bindings', template: '{{foo}}{{bar}}', watchersCount: VERSION_MINOR >= 3 ? 2 : 1 },
    { name: 'ng-model', template: '<input ng-model="foo">', $destroyCount: 1 },
    { name: 'ng-repeat', template: '<input ng-repeat="foo in foos">' },
    { name: 'ng-if', template: '<input ng-if="foo">' },
    { name: 'ng-class', template: '<input ng-class="foo">' },
    { name: 'ng-required', template: '<input ng-required="foo">' },
    { name: 'ng-readonly', template: '<input ng-readonly="foo">' },
    { name: 'ng-selected', template: '<input ng-selected="foo">' },
    { name: 'ng-value', template: '<input ng-value="foo">' },
    { name: 'ng-show', template: '<input ng-show="foo">' },
    { name: 'ng-hide', template: '<input ng-hide="foo">' },
    { name: 'ng-style', template: '<input ng-style="foo">' },
    { name: 'ng-bind', template: '<input ng-bind="foo">' },
    { name: 'ng-bind-html', template: '<input ng-bind-html="foo">' },
    { name: 'ng-maxlength', template: '<input ng-maxlength="foo">', skip: VERSION_MINOR < 3 },
    { name: 'ng-minlength', template: '<input ng-minlength="foo">', skip: VERSION_MINOR < 3 },
    { name: 'ng-switch', template: '<input ng-switch="foo">' },
    {
      name: 'ng-options',
      template: '<select ng-model="fooModel" ng-options="foo for foo in foos"></select>',
      watchersCount: VERSION_MINOR >= 3 ? 2 : 3,
      $destroyCount: 2
    }
  ], function(ngDirective) {
    if (ngDirective.skip) return;
    var watchersCount = ngDirective.watchersCount || 1;
    var $destroyCount = ngDirective.$destroyCount || 0;
    var desc = $destroyCount ? 'listeners and ' : '';
    it('should not duplicate ' + desc + 'watchers of ' + ngDirective.name, function() {
      var template = [
        '<!--bs-injular-start /app/foo.html-->',
        ngDirective.template,
        '<!--bs-injular-end /app/foo.html-->'
      ].join('');
      var element = angular.element([
        '<div ng-app="'+ngApp+'">',
        template,
        '</div>'
      ].join(''));
      rootElement.append(element);
      angular.bootstrap(element);
      element.injector().get('$templateCache').put('/app/foo.html', template);

      var $rootScope = element.injector().get('$rootScope');
      expect($rootScope.$$watchers.length).to.equal(watchersCount, 'beforeInjection $rootScope.$$watchers.length');
      if (CHECK_WATCHERS_COUNT) {
        expect($rootScope.$$watchersCount).to.equal(watchersCount, 'beforeInjection $rootScope.$$watchersCount');
      }
      if ($destroyCount) {
        expect($rootScope.$$listeners.$destroy.length).to.equal($destroyCount, 'beforeInjection $rootScope.$$listeners.$destroy.length');
        expect($rootScope.$$listenerCount.$destroy).to.equal($destroyCount, 'beforeInjection $rootScope.$$listenerCount.$destroy');
      }

      listener({
        template: template,
        templateUrl: '/app/foo.html'
      });

      // console.log($rootScope.$$watchers);
      // console.log($rootScope.$$listeners);

      expect($rootScope.$$watchers.length).to.equal(watchersCount, 'afterInjection $rootScope.$$watchers.length');
      if (CHECK_WATCHERS_COUNT) {
        expect($rootScope.$$watchersCount).to.equal(watchersCount, 'afterInjection $rootScope.$$watchersCount');
      }
      if ($destroyCount) {
        expect($rootScope.$$listeners.$destroy.length).to.equal($destroyCount, 'afterInjection $rootScope.$$listeners.$destroy.length');
        expect($rootScope.$$listenerCount.$destroy).to.equal($destroyCount, 'afterInjection $rootScope.$$listenerCount.$destroy');
      }
    });
  });


  it('should remove internal directive watchers', function() {
    var template = [
      '<!--bs-injular-start /app/foo.html-->',
      '<div bar></div>',
      '<!--bs-injular-end /app/foo.html-->'
    ].join('');
    var element = angular.element([
      '<div ng-app="'+ngApp+'">',
      '<div foo></div>',
      '</div>'
    ].join(''));
    rootElement.append(element);
    angular.bootstrap(element, [ngApp, provideDirective]);
    element.injector().get('$templateCache').put('/app/foo.html', template);

    var $rootScope = element.injector().get('$rootScope');
    expect($rootScope.$$watchers.length).to.equal(1, 'beforeInjection $rootScope.$$watchers.length');
    if (CHECK_WATCHERS_COUNT) {
      expect($rootScope.$$watchersCount).to.equal(1, 'beforeInjection $rootScope.$$watchersCount');
    }

    listener({
      template: template,
      templateUrl: '/app/foo.html'
    });

    expect($rootScope.$$watchers.length).to.equal(1, 'afterInjection $rootScope.$$watchers.length');
    if (CHECK_WATCHERS_COUNT) {
      expect($rootScope.$$watchersCount).to.equal(1, 'afterInjection $rootScope.$$watchersCount');
    }


    function provideDirective($compileProvider) {
      $compileProvider.directive('bar', function() {
        return {
          restrict: 'A',
          link: function(scope) {
            scope.$watch('bar', function() {});
          }
        };
      });
      $compileProvider.directive('foo', function($templateCache) {
        $templateCache.put('/app/foo.html', template);
        return {
          restrict: 'A',
          templateUrl: '/app/foo.html'
        };
      });
    }
  });


  it('should remove internal directive controller watchers', function() {
    var template = [
      '<!--bs-injular-start /app/foo.html-->',
      '<div bar></div>',
      '<!--bs-injular-end /app/foo.html-->'
    ].join('');
    var element = angular.element([
      '<div ng-app="'+ngApp+'">',
      '<div foo></div>',
      '</div>'
    ].join(''));
    rootElement.append(element);
    angular.bootstrap(element, [ngApp, provideDirective]);
    element.injector().get('$templateCache').put('/app/foo.html', template);

    var $rootScope = element.injector().get('$rootScope');
    expect($rootScope.$$watchers.length).to.equal(1, 'beforeInjection $rootScope.$$watchers.length');
    if (CHECK_WATCHERS_COUNT) {
      expect($rootScope.$$watchersCount).to.equal(1, 'beforeInjection $rootScope.$$watchersCount');
    }

    listener({
      template: template,
      templateUrl: '/app/foo.html'
    });

    expect($rootScope.$$watchers.length).to.equal(1, 'afterInjection $rootScope.$$watchers.length');
    if (CHECK_WATCHERS_COUNT) {
      expect($rootScope.$$watchersCount).to.equal(1, 'afterInjection $rootScope.$$watchersCount');
    }


    function provideDirective($compileProvider) {
      $compileProvider.directive('bar', function() {
        return {
          restrict: 'A',
          controller: function($scope) {
            $scope.$watch('bar', function() {});
          }
        };
      });
      $compileProvider.directive('foo', function($templateCache) {
        $templateCache.put('/app/foo.html', template);
        return {
          restrict: 'A',
          templateUrl: '/app/foo.html'
        };
      });
    }
  });


  it('should remove internal directive listeners', function() {
    var template = [
      '<!--bs-injular-start /app/foo.html-->',
      '<div bar></div>',
      '<!--bs-injular-end /app/foo.html-->'
    ].join('');
    var element = angular.element([
      '<div ng-app="'+ngApp+'">',
      '<div foo></div>',
      '</div>'
    ].join(''));
    rootElement.append(element);
    angular.bootstrap(element, [ngApp, provideDirective]);
    element.injector().get('$templateCache').put('/app/foo.html', template);

    var $rootScope = element.injector().get('$rootScope');
    expect($rootScope.$$listeners.bar.length).to.equal(1, 'beforeInjection $rootScope.$$listeners.bar.length');
    expect($rootScope.$$listenerCount.bar).to.equal(1, 'beforeInjection $rootScope.$$listenerCount.bar');

    listener({
      template: template,
      templateUrl: '/app/foo.html'
    });

    expect($rootScope.$$listeners.bar.length).to.equal(1, 'afterInjection $rootScope.$$listeners.bar.length');
    expect($rootScope.$$listenerCount.bar).to.equal(1, 'afterInjection $rootScope.$$listenerCount.bar');


    function provideDirective($compileProvider) {
      $compileProvider.directive('bar', function() {
        return {
          restrict: 'A',
          link: function(scope) {
            scope.$on('bar', function() {});
          }
        };
      });
      $compileProvider.directive('foo', function($templateCache) {
        $templateCache.put('/app/foo.html', template);
        return {
          restrict: 'A',
          templateUrl: '/app/foo.html'
        };
      });
    }
  });

});
