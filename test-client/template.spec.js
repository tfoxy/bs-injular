'use strict';

describe('template changed listener', function() {
  var TEMPLATE_CHANGED_EVENT = 'injularTemplate:changed';
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


  it('should replace the template comments and all nodes between them with the template data', function() {
    var template = [
      '<!--bs-injular-start /app/foo.html-->',
      '<div>FOO</div>',
      '<!--bs-injular-end /app/foo.html-->'
    ].join('');
    var element = angular.element([
      '<div ng-app="app">',
      template,
      '</div>'
    ].join(''));
    rootElement.append(element);
    expect(element.text()).to.equal('FOO');

    angular.bootstrap(element);
    element.injector().get('$templateCache').put('/app/foo.html', template);

    listener({
      template: '<span>BAR</span>',
      templateUrl: '/app/foo.html'
    });
    expect(element.text()).to.equal('BAR');
    expect(element.children()).to.have.length(1);
  });


  it('should work when the path of the templateCache is relative', function() {
    var template = [
      '<!--bs-injular-start /app/foo.html-->',
      '<div>FOO</div>',
      '<!--bs-injular-end /app/foo.html-->'
    ].join('');
    var element = angular.element([
      '<div ng-app="app">',
      template,
      '</div>'
    ].join(''));
    rootElement.append(element);
    expect(element.text()).to.equal('FOO');

    angular.bootstrap(element);
    element.injector().get('$templateCache').put('app/foo.html', template);

    listener({
      template: '<span>BAR</span>',
      templateUrl: '/app/foo.html'
    });
    expect(element.text()).to.equal('BAR');
    expect(element.children()).to.have.length(1);
  });


  describe('without document.createTreeWalker', function() {
    var createTreeWalker;

    before(function() {
      createTreeWalker = document.createTreeWalker;
      document.createTreeWalker = undefined;
    });

    after(function() {
      document.createTreeWalker = createTreeWalker;
    });

    it('should work', function() {
      var template = [
        '<!--bs-injular-start /app/foo.html-->',
        '<div>FOO</div>',
        '<!--bs-injular-end /app/foo.html-->'
      ].join('');
      var element = angular.element([
        '<div ng-app="app">',
        template,
        '</div>'
      ].join(''));
      rootElement.append(element);
      expect(element.text()).to.equal('FOO');

      angular.bootstrap(element);
      element.injector().get('$templateCache').put('/app/foo.html', template);

      listener({
        template: '<span>BAR</span>',
        templateUrl: '/app/foo.html'
      });
      expect(element.text()).to.equal('BAR');
      expect(element.children()).to.have.length(1);
    });

    it('should work on nested elements', function() {
      var template = [
        '<!--bs-injular-start /app/foo.html-->',
        '<div>FOO</div>',
        '<!--bs-injular-end /app/foo.html-->'
      ].join('');
      var element = angular.element([
        '<div ng-app="app">',
        '<span>1',
        '<span>2</span>',
        template,
        '<span>3</span>',
        '4</span>',
        '</div>'
      ].join(''));
      rootElement.append(element);
      expect(element.text()).to.equal('12FOO34');

      angular.bootstrap(element);
      element.injector().get('$templateCache').put('/app/foo.html', template);

      listener({
        template: '<span>BAR</span>',
        templateUrl: '/app/foo.html'
      });
      expect(element.text()).to.equal('12BAR34');
      expect(element.children()).to.have.length(1);
      expect(element.children().children()).to.have.length(3);
    });

  });


  describe('', function() {
    var querySelector;

    before(function() {
      querySelector = document.querySelector;
      document.querySelector = undefined;
    });

    after(function() {
      document.querySelector = querySelector;
    });

    it('should print a warning when querySelector is not found', function() {
      var fn = listener.bind(null, {
        template: '',
        templateUrl: '/app/foo.html'
      });

      expect(fn).to.throw('querySelector');
    });

  });


  it('should print a warning when an [ng-app] element is not found', function() {
    var fn = listener.bind(null, {
      template: '',
      templateUrl: '/app/foo.html'
    });

    expect(fn).to.throw(Error)
    .that.has.property('message')
    .that.contains('[ng-app]').and.not.contains('$injector');
  });


  it('should give a warning when $injector is not found', function() {
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);

    var fn = listener.bind(null, {
      template: '',
      templateUrl: '/app/foo.html'
    });

    expect(fn).to.throw('$injector');
  });


  it('should give a warning when templaceCache is not found', function() {
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);
    angular.bootstrap(element);

    var fn = listener.bind(null, {
      template: '',
      templateUrl: '/app/foo.html'
    });

    expect(fn).to.throw('templateCache');
  });


  it('should print a warning when a bs-injular-end comment is not found', function() {
    var routeReload = sinon.spy();
    var template = [
      '<!--bs-injular-start /app/foo.html-->',
      '<div>FOO</div>'
    ].join('');
    var element = angular.element([
      '<div ng-app="app">',
      template,
      '</div>'
    ].join(''));
    rootElement.append(element);
    angular.bootstrap(element, ['app', provideRoute]);
    element.injector().get('$templateCache').put('/app/foo.html', template);

    var fn = listener.bind(null, {
      template: '',
      templateUrl: '/app/foo.html'
    });

    expect(fn).to.throw('bs-injular-end');
    expect(routeReload).to.have.callCount(1);


    function provideRoute($provide) {
      $provide.constant('$route', {reload: routeReload});
    }
  });


  it('should preserve the form of the scope', function() {
    var template = [
      '<!--bs-injular-start /app/foo.html-->',
      '<form name="fooForm">FOO</form>',
      '<!--bs-injular-end /app/foo.html-->'
    ].join('');
    var element = angular.element([
      '<div ng-app="app">',
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
      '<div ng-app="app">',
      '<i ng-controller="Foo">',
      template,
      '</i>',
      '</div>'
    ].join(''));
    rootElement.append(element);
    angular.bootstrap(element, ['app', registerControllers]);
    element.injector().get('$templateCache').put('/app/foo.html', template);

    expect(element.find('i').scope()).to.have.property('foo', 'foo1');
    expect(element.find('b').scope()).to.have.property('bar', 'bar1');
    expect(element.find('b').scope()).to.have.property('fooAux', 'foo1');

    listener({
      template: template,
      templateUrl: '/app/foo.html'
    });

    expect(element.find('i').scope()).to.have.property('foo', 'foo1');
    expect(element.find('b').scope()).to.have.property('bar', 'bar2');
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
      '<div ng-app="app">',
      '<div foo></div>',
      '</div>'
    ].join(''));
    rootElement.append(element);
    angular.bootstrap(element, ['app', provideDirective]);

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

});
