'use strict';

describe('controller changed listener', function() {
  var CONTROLLER_CHANGED_EVENT = 'injularScript:changed';
  var bs = window.___browserSync___;
  var listener = bs.__events[CONTROLLER_CHANGED_EVENT];
  var rootElement, warn;

  before(function() {
    var body = angular.element(document.body);
    rootElement = angular.element('<div></div>');
    body.append(rootElement);
    warn = console.warn;
  });

  beforeEach(function() {
    console.warn = throwWarningError;
  });

  afterEach(function() {
    rootElement.children().remove();
    delete window.___bsInjular___;
  });

  after(function() {
    rootElement.remove();
    console.warn = warn;
  });

  function throwWarningError(msg) {
    throw new Error('Warning printed: ' + msg);
  }


  it('should call $controllerProvider.register when receiving an angular.controller file', function() {
    var $controllerProvider = {register: sinon.spy()};
    window.___bsInjular___ = {$controllerProvider: $controllerProvider};
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);
    angular.bootstrap(element, ['app', provideRouteSpy]);

    listener({
      script: "angular.module('app').controller('fooCtrl', function(){})"
    });

    expect($controllerProvider.register).to.have.callCount(1);
    expect($controllerProvider.register).to.have.been.calledWith('fooCtrl');

    function provideRouteSpy($provide) {
      $provide.constant('$route', {reload: angular.noop});
    }
  });


  it('should call $route.reload on success', function() {
    var $route = {reload: sinon.spy()};
    var $controllerProvider = {register: angular.noop};
    window.___bsInjular___ = {$controllerProvider: $controllerProvider};
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);
    angular.bootstrap(element, ['app', provideRouteSpy]);

    listener({
      script: ''
    });

    expect($route.reload).to.have.callCount(1);

    function provideRouteSpy($provide) {
      $provide.constant('$route', $route);
    }
  });


  it('should call $state.reload on success', function() {
    var $state = {reload: sinon.spy()};
    var $controllerProvider = {register: angular.noop};
    window.___bsInjular___ = {$controllerProvider: $controllerProvider};
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);
    angular.bootstrap(element, ['app', provideStateSpy]);

    listener({
      script: ''
    });

    expect($state.reload).to.have.callCount(1);

    function provideStateSpy($provide) {
      $provide.constant('$state', $state);
    }
  });


  it('should print a warning when window.___bsInjular___ is not found', function() {
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);
    angular.bootstrap(element);
    console.warn = sinon.spy();
    listener({
      script: ''
    });

    expect(console.warn).to.have.callCount(1);
    expect(console.warn).to.have.been.calledWithMatch('window.___bsInjular___');
  });


  it('should print a warning when ___bsInjular___.$controllerProvider is not found', function() {
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);
    angular.bootstrap(element);
    window.___bsInjular___ = {};
    console.warn = sinon.spy();
    listener({
      script: "angular.module('app').controller('fooCtrl', function(){})"
    });

    expect(console.warn).to.have.callCount(1);
    expect(console.warn).to.have.been.calledWithMatch('$controllerProvider');
  });


  describe('', function() {
    var angular;

    before(function() {
      angular = window.angular;
    });

    after(function() {
      window.angular = angular;
    });

    it('should print a warning when window.angular is not found', function() {
      var element = angular.element('<div ng-app="app"></div>');
      rootElement.append(element);
      angular.bootstrap(element);
      delete window.angular;
      window.___bsInjular___ = {$controllerProvider: {}};
      console.warn = sinon.spy();
      listener({
        script: ''
      });

      expect(console.warn).to.have.callCount(1);
      expect(console.warn).to.have.been.calledWithMatch('window.angular');
    });

  });


  it('should give a warning when $injector is not found', function() {
    window.___bsInjular___ = {$controllerProvider: {}};
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);
    console.warn = sinon.spy();

    listener({
      template: '',
      templateUrl: '/app/foo.html'
    });

    expect(console.warn).to.have.callCount(1);
    expect(console.warn).to.have.been.calledWithMatch('$injector');
  });


  it('should give a warning when $route nor $state is found', function() {
    window.___bsInjular___ = {$controllerProvider: {}};
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);
    angular.bootstrap(element);
    console.warn = sinon.spy();

    listener({
      template: '',
      templateUrl: '/app/foo.html'
    });

    expect(console.warn).to.have.callCount(1);
    expect(console.warn).to.have.been.calledWithMatch('$route');
    expect(console.warn).to.have.been.calledWithMatch('$state');
  });

});
