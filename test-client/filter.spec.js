'use strict';

describe('filter changed listener', function() {
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
    window.___bsInjular___ = undefined;
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

  function changeFilterProviderRegister($filterProvider) {
    window.___bsInjular___.filtersCache = {};
    var register = $filterProvider.register;

    $filterProvider.register = injularRegisterFilter;

    function injularRegisterFilter(name, filterFactory) {
      return register.call($filterProvider, name, injularFilterFactory);
      
      function injularFilterFactory($injector) {
        var filter = $injector.invoke(filterFactory);
        window.___bsInjular___.filtersCache[name] = filter;
        return function() {
          return window.___bsInjular___.filtersCache[name].apply(this, arguments);
        };
      }
    }
  }


  it('should call $filterProvider.register when receiving an angular.filter file', function() {
    var $filterProvider = {register: sinon.spy()};
    window.___bsInjular___ = {$filterProvider: $filterProvider, filtersCache: {}};
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);
    angular.bootstrap(element, ['app', provideRoute]);

    listener({
      script: "angular.module('app').filter('foo', function(){return function(){}})",
      scriptUrl: 'app/foo.filter.js',
      recipes: ['filter']
    });

    expect($filterProvider.register).to.have.callCount(1);
    expect($filterProvider.register).to.have.been.calledWith('foo');
  });


  it('should change the filter received by $filter service', function() {
    window.___bsInjular___ = {};
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);
    angular.bootstrap(element, ['app', provide]);
    var $injector = element.injector();
    var $filter = $injector.get('$filter');
    expect($filter('foo')()).to.equal('foo');

    listener({
      script: "angular.module('app').filter('foo', function(){return function(){return 'bar';};})",
      scriptUrl: 'app/foo.filter.js',
      recipes: ['filter']
    });

    expect($filter('foo')()).to.equal('bar');

    function provide($provide, $filterProvider) {
      provideRoute($provide);
      changeFilterProviderRegister($filterProvider);
      $filterProvider.register('foo', function(){return function(){return 'foo';};});
      window.___bsInjular___.$filterProvider = $filterProvider;
    }
  });


  it('should call $route.reload on success', function() {
    var $route = {reload: sinon.spy()};
    var $filterProvider = {register: angular.noop};
    window.___bsInjular___ = {$filterProvider: $filterProvider};
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);
    angular.bootstrap(element, ['app', provideRouteSpy]);

    listener({
      script: '',
      scriptUrl: 'app/foo.filter.js',
      recipes: ['filter']
    });

    expect($route.reload).to.have.callCount(1);

    function provideRouteSpy($provide) {
      $provide.constant('$route', $route);
    }
  });


  it('should call $state.reload on success', function() {
    var $state = {reload: sinon.spy()};
    var $filterProvider = {register: angular.noop};
    window.___bsInjular___ = {$filterProvider: $filterProvider};
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);
    angular.bootstrap(element, ['app', provideStateSpy]);

    listener({
      script: '',
      scriptUrl: 'app/foo.filter.js',
      recipes: ['filter']
    });

    expect($state.reload).to.have.callCount(1);

    function provideStateSpy($provide) {
      $provide.constant('$state', $state);
    }
  });


  it('should throw an error when ___bsInjular___.$filterProvider is not found', function() {
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);
    angular.bootstrap(element);
    window.___bsInjular___ = {filtersCache: {}};

    expect(fn).to['throw']('$filterProvider');

    function fn() {
      listener({
        script: "angular.module('app').filter('fooCtrl', function(){})",
        scriptUrl: 'app/foo.filter.js',
        recipes: ['filter']
      });
    }
  });

});
