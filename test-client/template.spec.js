'use strict';

/* global jQuery */

describe('template changed listener', function() {
  var VERSION_MINOR = angular.version.minor;
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

    var newTemplate = [
      '<!--bs-injular-start /app/foo.html-->',
      '<span>BAR</span>',
      '<!--bs-injular-end /app/foo.html-->'
    ].join('');
    listener({
      template: newTemplate,
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

    var newTemplate = [
      '<!--bs-injular-start /app/foo.html-->',
      '<span>BAR</span>',
      '<!--bs-injular-end /app/foo.html-->'
    ].join('');
    listener({
      template: newTemplate,
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

      var newTemplate = [
        '<!--bs-injular-start /app/foo.html-->',
        '<span>BAR</span>',
        '<!--bs-injular-end /app/foo.html-->'
      ].join('');
      listener({
        template: newTemplate,
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

      var newTemplate = [
        '<!--bs-injular-start /app/foo.html-->',
        '<span>BAR</span>',
        '<!--bs-injular-end /app/foo.html-->'
      ].join('');
      listener({
        template: newTemplate,
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


  it('should autoclose with bs-injular-end comment if it is not found', function() {
    var template = [
      '<!--bs-injular-start /app/error.html-->',
      '<div>FOO</div>',
      '<!--bs-injular-end /app/error.html-->'
    ].join('');
    var element = angular.element([
      '<div ng-app="app">',
      template,
      '</div>'
    ].join(''));
    rootElement.append(element);
    angular.bootstrap(element);
    element.injector().get('$templateCache').put('/app/error.html', template);

    var newTemplate = [
      '<!--bs-injular-start /app/error.html-->',
      '<div>FOO</span>', // malformed template
      '<!--bs-injular-end /app/error.html-->'
    ].join('');

    listener({
      template: newTemplate,
      templateUrl: '/app/error.html'
    });
    listener({
      template: newTemplate,
      templateUrl: '/app/error.html'
    });

    expect(element.text()).to.equal('FOO');
  });


  it('should inject multiple templates inside an ng-repeat', function() {
    var template = [
      '<!--bs-injular-start /app/foo.html-->',
      '<span>FOO</span>',
      '<!--bs-injular-end /app/foo.html-->'
    ].join('');
    var element = angular.element([
      '<div ng-app="app">',
      '<div ng-repeat="i in [1,2]">',
      '<div foo></div>',
      '</div>',
      '</div>'
    ].join(''));
    rootElement.append(element);
    angular.bootstrap(element, ['app', provideDirective]);
    expect(element.text()).to.equal('FOOFOO');

    var newTemplate = [
      '<!--bs-injular-start /app/foo.html-->',
      '<span>BAR</span>',
      '<!--bs-injular-end /app/foo.html-->'
    ].join('');

    listener({
      template: newTemplate,
      templateUrl: '/app/foo.html'
    });

    expect(element.text()).to.equal('BARBAR');


    function provideDirective($compileProvider) {
      $compileProvider.directive('foo', function($templateCache) {
        $templateCache.put('/app/foo.html', template);
        return {
          restrict: 'A',
          templateUrl: '/app/foo.html'
        };
      });
    }
  });


  if (VERSION_MINOR > 2) {
    it('should inject multiple nested templates inside an ng-repeat', function() {
      var template = [
        '<!--bs-injular-start /app/foo.html-->',
        '<div ng-if="nest" foo="false"></div>',
        '<span ng-if="!nest">FOO</span>',
        '<!--bs-injular-end /app/foo.html-->'
      ].join('');
      var element = angular.element([
        '<div ng-app="app">',
        '<div ng-repeat="i in [1,2]">',
        '<div foo="true"></div>',
        '</div>',
        '</div>'
      ].join(''));
      rootElement.append(element);
      angular.bootstrap(element, ['app', provideDirective]);
      expect(element.text()).to.equal('FOOFOO');

      var newTemplate = [
        '<!--bs-injular-start /app/foo.html-->',
        '<div ng-if="nest" foo="false"></div>',
        '<span ng-if="!nest">BAR</span>',
        '<!--bs-injular-end /app/foo.html-->'
      ].join('');

      listener({
        template: newTemplate,
        templateUrl: '/app/foo.html'
      });

      expect(element.text()).to.equal('BARBAR');


      function provideDirective($compileProvider) {
        $compileProvider.directive('foo', function($templateCache) {
          $templateCache.put('/app/foo.html', template);
          return {
            restrict: 'A',
            templateUrl: '/app/foo.html',
            scope: { nest: '=foo' }
          };
        });
      }
    });
  }


  describe('with jQuery', function() {
    var originalAngularElement;

    before(function() {
      var JQLitePrototype = angular.element.prototype;
      originalAngularElement = angular.element;
      angular.element = jQuery;
      angular.extend(jQuery.fn, {
        scope: JQLitePrototype.scope,
        isolateScope: JQLitePrototype.isolateScope,
        controller: JQLitePrototype.controller,
        injector: JQLitePrototype.injector,
        inheritedData: JQLitePrototype.inheritedData
      });
    });

    after(function() {
      angular.element = originalAngularElement;
    });

    it('should not duplicate templates', function() {
      var template = [
        '<!--bs-injular-start /app/foo.html-->',
        '<div>FOO</div>',
        '<div>FOO</div>',
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

      var newTemplate = [
        '<!--bs-injular-start /app/foo.html-->',
        '<span>BAR</span>',
        '<span>BAR</span>',
        '<!--bs-injular-end /app/foo.html-->'
      ].join('');
      listener({
        template: newTemplate,
        templateUrl: '/app/foo.html'
      });
      expect(element.text()).to.equal('BARBAR');
      expect(element.children()).to.have.length(2);
    });

  });

});
