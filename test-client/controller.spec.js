'use strict';

describe('controller changed listener', function() {
  var CONTROLLER_CHANGED_EVENT = 'injularScript:changed';
  var bs = window.___browserSync___;
  var listener = bs.__events[CONTROLLER_CHANGED_EVENT];
  var rootElement, warn;

  /* eslint-disable no-console */
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
  /* eslint-enable no-console */

  function throwWarningError(msg) {
    throw new Error('Warning printed: ' + msg);
  }

  function provideRoute($provide) {
    $provide.constant('$route', {reload: angular.noop});
  }


  it('should call $controllerProvider.register when receiving an angular.controller file', function() {
    var $controllerProvider = {register: sinon.spy()};
    window.___bsInjular___ = {$controllerProvider: $controllerProvider};
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);
    angular.bootstrap(element, ['app', provideRoute]);

    listener({
      script: "angular.module('app').controller('fooCtrl', function(){})",
      scriptUrl: 'app/foo.controller.js',
      recipes: ['controller']
    });

    expect($controllerProvider.register).to.have.callCount(1);
    expect($controllerProvider.register).to.have.been.calledWith('fooCtrl');
  });


  it('should change the controller received by $controller service', function() {
    window.___bsInjular___ = {};
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);
    angular.bootstrap(element, ['app', provide]);
    var $injector = element.injector();
    var $controller = $injector.get('$controller');
    expect($controller('fooCtrl')).to.have.property('foo', 'foo');

    listener({
      script: "angular.module('app').controller('fooCtrl', function(){this.foo = 'bar';})",
      scriptUrl: 'app/foo.controller.js',
      recipes: ['controller']
    });

    expect($controller('fooCtrl')).to.have.property('foo', 'bar');

    function provide($provide, $controllerProvider) {
      provideRoute($provide);
      $controllerProvider.register('fooCtrl', function(){this.foo = 'foo';});
      window.___bsInjular___.$controllerProvider = $controllerProvider;
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
      script: '',
      scriptUrl: 'app/foo.controller.js',
      recipes: ['controller']
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
      script: '',
      scriptUrl: 'app/foo.controller.js',
      recipes: ['controller']
    });

    expect($state.reload).to.have.callCount(1);

    function provideStateSpy($provide) {
      $provide.constant('$state', $state);
    }
  });


  it('should throw an error when window.___bsInjular___ is not found', function() {
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);
    angular.bootstrap(element);
    
    var fn = listener.bind(null, {
      script: '',
      scriptUrl: 'app/foo.controller.js',
      recipes: ['controller']
    });

    expect(fn).to.throw('window.___bsInjular___');
  });


  it('should throw an error when ___bsInjular___.$controllerProvider is not found', function() {
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);
    angular.bootstrap(element);
    window.___bsInjular___ = {};

    var fn = listener.bind(null, {
      script: "angular.module('app').controller('fooCtrl', function(){})",
      scriptUrl: 'app/foo.controller.js',
      recipes: ['controller']
    });

    expect(fn).to.throw('$controllerProvider');
  });


  describe('', function() {
    var angular;

    before(function() {
      angular = window.angular;
    });

    after(function() {
      window.angular = angular;
    });

    it('should throw an error when window.angular is not found', function() {
      var element = angular.element('<div ng-app="app"></div>');
      rootElement.append(element);
      angular.bootstrap(element);
      delete window.angular;
      window.___bsInjular___ = {$controllerProvider: {}};
      
      var fn = listener.bind(null, {
        script: '',
        scriptUrl: 'app/foo.controller.js',
        recipes: ['controller']
      });

      expect(fn).to.throw('window.angular');
    });

  });


  it('should throw an error when $injector is not found', function() {
    window.___bsInjular___ = {$controllerProvider: {}};
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);

    var fn = listener.bind(null, {
      script: '',
      scriptUrl: 'app/foo.controller.js',
      recipes: ['controller']
    });

    expect(fn).to.throw('$injector');
  });


  it('should throw an error when $route nor $state is found', function() {
    window.___bsInjular___ = {$controllerProvider: {}};
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);
    angular.bootstrap(element);

    var fn = listener.bind(null, {
      script: '',
      scriptUrl: 'app/foo.controller.js',
      recipes: ['controller']
    });

    expect(fn).to.throw(Error)
    .that.has.property('message')
    .that.contains('$state').and.contains('$route');
  });

});
