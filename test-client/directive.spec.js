'use strict';

describe('directive changed listener', function() {
  var VERSION_MINOR = angular.version.minor;
  var DIRECTIVE_CHANGED_EVENT = 'injularScript:changed';
  var bs = window.___browserSync___;
  var listener = bs.__events[DIRECTIVE_CHANGED_EVENT];
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

  function valueFn(value) {
    return function() {
      return value;
    };
  }


  it('should replace directive with injected one', function() {
    var fooDirective = {
      compile: angular.noop,
      foo: 'bar'
    };
    window.___bsInjular___ = {directivesByUrl: {'/app/foo.directive.js': {foo: [fooDirective]}}};
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);
    angular.bootstrap(element, ['app', provide]);
    element.injector().get('fooDirective');  // Initialize directive

    listener({
      scriptUrl: '/app/foo.directive.js',
      script: [
        "angular.module('app')",
        ".directive('foo', function(){return {compile: function(){}, bar: 'foo'};})"
      ].join(''),
      recipes: ['directive']
    });

    expect(fooDirective).to.have.property('bar', 'foo');
    expect(fooDirective).to.not.have.property('foo');
    expect(fooDirective).to.have.property('compile').that.not.equals(angular.noop);

    function provide($provide, $compileProvider) {
      provideRoute($provide);
      $compileProvider.directive('foo', valueFn(fooDirective));
    }
  });


  it('should be able to inject two directives with same name', function() {
    var fooDirective = {
      compile: angular.noop,
      foo: 'foo'
    };
    var fooDirective2 = {
      compile: angular.noop,
      foo: 'foo2'
    };
    window.___bsInjular___ = {
      directivesByUrl: {
        '/app/foo.directive.js': {
          foo: [fooDirective, fooDirective2]
        }
      }
    };
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);
    angular.bootstrap(element, ['app', provide]);
    element.injector().get('fooDirective');

    listener({
      scriptUrl: '/app/foo.directive.js',
      script: [
        "angular.module('app')",
        ".directive('foo', function(){return {compile: function(){}, foo: 'bar'};})",
        ".directive('foo', function(){return {compile: function(){}, foo: 'bar2'};})"
      ].join(''),
      recipes: ['directive']
    });

    expect(fooDirective).to.have.property('foo', 'bar');
    expect(fooDirective2).to.have.property('foo', 'bar2');

    function provide($provide, $compileProvider) {
      provideRoute($provide);
      $compileProvider.directive('foo', valueFn(fooDirective));
      $compileProvider.directive('foo', valueFn(fooDirective2));
    }
  });


  it('should be able to add a new directive with the same name as another existing directive', function() {
    var fooDirective = {
      compile: angular.noop,
      foo: 'foo'
    };
    window.___bsInjular___ = {
      directivesByUrl: {
        '/app/foo.directive.js': {
          foo: [fooDirective]
        }
      }
    };
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);
    angular.bootstrap(element, ['app', provide]);
    element.injector().get('fooDirective');

    listener({
      scriptUrl: '/app/foo.directive.js',
      script: [
        "angular.module('app')",
        ".directive('foo', function(){return {compile: function(){}, foo: 'bar'};})",
        ".directive('foo', function(){return {compile: function(){}, foo: 'bar2'};})"
      ].join(''),
      recipes: ['directive']
    });

    var $injector = element.injector();
    var directives = $injector.get('fooDirective');
    expect(directives).to.have.length(2);
    expect(directives[0]).to.equal(fooDirective);
    expect(directives[0]).to.have.property('foo', 'bar');
    expect(directives[1]).to.have.property('foo', 'bar2');
    expect(directives[1]).to.have.property('index', 1);

    function provide($provide, $compileProvider) {
      window.___bsInjular___.$compileProvider = $compileProvider;
      provideRoute($provide);
      $compileProvider.directive('foo', valueFn(fooDirective));
    }
  });


  it('should be able to inject a directive with another of the same in a different file', function() {
    var fooDirective = {
      compile: angular.noop,
      foo: 'foo'
    };
    var fooDirective2 = {
      compile: angular.noop,
      foo: 'foo2'
    };
    window.___bsInjular___ = {
      directivesByUrl: {
        '/app/foo.directive.js': {
          foo: [fooDirective]
        },
        '/app/foo2.directive.js': {
          foo: [fooDirective2]
        }
      }
    };
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);
    angular.bootstrap(element, ['app', provide]);
    element.injector().get('fooDirective');

    listener({
      scriptUrl: '/app/foo2.directive.js',
      script: [
        "angular.module('app')",
        ".directive('foo', function(){return {compile: function(){}, foo: 'bar'};})"
      ].join(''),
      recipes: ['directive']
    });

    expect(fooDirective).to.have.property('foo', 'foo');
    expect(fooDirective2).to.have.property('foo', 'bar');

    function provide($provide, $compileProvider) {
      provideRoute($provide);
      $compileProvider.directive('foo', valueFn(fooDirective));
      $compileProvider.directive('foo', valueFn(fooDirective2));
    }
  });


  it('should throw an error when directivesByUrl is not found', function() {
    window.___bsInjular___ = {};
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);
    angular.bootstrap(element);

    var fn = listener.bind(null, {
      scriptUrl: '/app/foo.directive.js',
      script: [
        "angular.module('app')",
        ".directive('foo', function(){return {compile: function(){}, bar: 'foo'};})"
      ].join(''),
      recipes: ['directive']
    });

    expect(fn).to.throw('directivesByUrl');
  });


  it('should add a new directive if a previous one didn\'t exist', function() {
    window.___bsInjular___ = {directivesByUrl: {'/app/foo.directive.js': {}}};
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);
    angular.bootstrap(element, ['app', provide]);

    listener({
      scriptUrl: '/app/foo.directive.js',
      script: [
        "angular.module('app')",
        ".directive('foo', function(){return {compile: function(){}, foo: 'bar'};})"
      ].join(''),
      recipes: ['directive']
    });

    var $injector = element.injector();
    expect($injector.get('fooDirective'))
    .to.have.length(1)
    .and.to.have.property('0')
    .that.has.property('foo', 'bar');

    expect(window.___bsInjular___.directivesByUrl['/app/foo.directive.js'])
    .to.have.property('foo').that.has.length(1);

    function provide($provide, $compileProvider) {
      provideRoute($provide);
      window.___bsInjular___.$compileProvider = $compileProvider;
    }
  });


  it('should remove a directive if its file removed it', function() {
    var fooDirective = {
      compile: angular.noop,
      foo: 'bar'
    };
    var directiveList = [fooDirective];
    window.___bsInjular___ = {directivesByUrl: {'/app/foo.directive.js': {foo: directiveList}}};
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);
    angular.bootstrap(element, ['app', provide]);
    element.injector().get('fooDirective');

    listener({
      scriptUrl: '/app/foo.directive.js',
      script: '',
      recipes: ['directive']
    });

    var $injector = element.injector();
    expect($injector.get('fooDirective')).to.have.length(0);
    // expect(directiveList).to.have.length(0);

    function provide($provide, $compileProvider) {
      provideRoute($provide);
      $compileProvider.directive('foo', valueFn(fooDirective));
    }
  });


  it('should remove only one directive if its file had two, but only one is present now', function() {
    var fooDirective = {
      compile: angular.noop,
      foo: 'foo'
    };
    var fooDirective2 = {
      compile: angular.noop,
      foo: 'foo2'
    };
    var directiveList = [fooDirective, fooDirective2];
    window.___bsInjular___ = {
      directivesByUrl: {
        '/app/foo.directive.js': {
          foo: directiveList
        }
      }
    };
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);
    angular.bootstrap(element, ['app', provide]);
    element.injector().get('fooDirective');

    listener({
      scriptUrl: '/app/foo.directive.js',
      script: [
        "angular.module('app')",
        ".directive('foo', function(){return {compile: function(){}, foo: 'bar'};})"
      ].join(''),
      recipes: ['directive']
    });

    var $injector = element.injector();
    expect($injector.get('fooDirective')).to.have.length(1);
    // expect(directiveList).to.have.length(1);

    function provide($provide, $compileProvider) {
      provideRoute($provide);
      $compileProvider.directive('foo', valueFn(fooDirective));
      $compileProvider.directive('foo', valueFn(fooDirective2));
    }
  });


  it('should remove a directive even if it was never initialized', function() {
    var angular = window.angular.copy(window.angular);
    var fooDirective = {
      compile: angular.noop,
      foo: 'bar'
    };
    var directiveUrl = '/app/foo.directive.js';
    window.fileChanger._appendAngularModulePatchFunction(angular, window);
    window.___bsInjular___.addScriptUrlToDirectives(directiveUrl);
    angular.module('appCopy', []).directive('foo', function() {
      return fooDirective;
    });
    var element = angular.element('<div ng-app="appCopy"></div>');
    rootElement.append(element);
    angular.bootstrap(element, ['appCopy', provideRoute]);

    listener({
      scriptUrl: directiveUrl,
      script: '',
      recipes: ['directive']
    });

    var $injector = element.injector();
    expect($injector.get('fooDirective')).to.have.length(0);
    expect(window.___bsInjular___.directivesByUrl[directiveUrl].foo)
    .to.have.length(1);
  });


  it('should not remove the following properties: index', function() {
    var fooDirective = {
      compile: angular.noop,
      foo: 'bar'
    };
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);
    angular.bootstrap(element, ['app', provide]);
    var $injector = element.injector();
    var fooDirectives = $injector.get('fooDirective').slice(); // slice for copy
    window.___bsInjular___ = {directivesByUrl: {'/app/foo.directive.js': {foo: fooDirectives}}};

    listener({
      scriptUrl: '/app/foo.directive.js',
      script: [
        "angular.module('app')",
        ".directive('foo', function(){return {compile: function(){}, foo: 'bar'};})"
      ].join(''),
      recipes: ['directive']
    });

    expect(fooDirective).to.have.property('index', 0);

    function provide($provide, $compileProvider) {
      provideRoute($provide);
      $compileProvider.directive('foo', valueFn(fooDirective));
    }
  });


  it('should be able to inject a directive as a postLink function', function() {
    var fooDirective = {
      compile: angular.noop,
      foo: 'bar'
    };
    window.___bsInjular___ = {directivesByUrl: {'/app/foo.directive.js': {foo: [fooDirective]}}};
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);
    angular.bootstrap(element, ['app', provide]);
    element.injector().get('fooDirective');

    listener({
      scriptUrl: '/app/foo.directive.js',
      script: [
        "angular.module('app')",
        ".directive('foo', function(){return function(){return 'foo'};})"
      ].join(''),
      recipes: ['directive']
    });

    expect(fooDirective).to.have.property('compile').that.is.a('function');
    expect(fooDirective.compile()).to.be.a('function');
    expect(fooDirective.compile()()).to.equal('foo');

    function provide($provide, $compileProvider) {
      provideRoute($provide);
      $compileProvider.directive('foo', valueFn(fooDirective));
    }
  });


  it('should be able to inject a directive with a link function (and no compile)', function() {
    var fooDirective = {
      compile: angular.noop,
      foo: 'bar'
    };
    window.___bsInjular___ = {directivesByUrl: {'/app/foo.directive.js': {foo: [fooDirective]}}};
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);
    angular.bootstrap(element, ['app', provide]);
    element.injector().get('fooDirective');

    listener({
      scriptUrl: '/app/foo.directive.js',
      script: [
        "angular.module('app')",
        ".directive('foo', function(){return {link: function(){return 'foo'}};})"
      ].join(''),
      recipes: ['directive']
    });

    expect(fooDirective).to.have.property('compile');
    expect(fooDirective.compile()).to.be.a('function');
    expect(fooDirective.compile()()).to.equal('foo');

    function provide($provide, $compileProvider) {
      provideRoute($provide);
      $compileProvider.directive('foo', valueFn(fooDirective));
    }
  });


  it('should reset directive priority if its not present anymore', function() {
    var fooDirective = {
      compile: angular.noop,
      priority: 100
    };
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);
    angular.bootstrap(element, ['app', provide]);
    element.injector().get('fooDirective');
    var $injector = element.injector();
    var fooDirectives = $injector.get('fooDirective').slice(); // slice for copy
    window.___bsInjular___ = {directivesByUrl: {'/app/foo.directive.js': {foo: fooDirectives}}};

    expect(fooDirective).to.have.property('priority', 100);

    listener({
      scriptUrl: '/app/foo.directive.js',
      script: [
        "angular.module('app')",
        ".directive('foo', function(){return {compile: function(){}};})"
      ].join(''),
      recipes: ['directive']
    });

    expect(fooDirective).to.have.property('priority', 0);

    function provide($provide, $compileProvider) {
      provideRoute($provide);
      $compileProvider.directive('foo', valueFn(fooDirective));
    }
  });


  it('should remove a directive related only to the modified file, if it was removed from it', function() {
    var fooDirective = {
      compile: angular.noop,
      foo: 'foo'
    };
    var fooDirective2 = {
      compile: angular.noop,
      foo: 'foo2'
    };
    window.___bsInjular___ = {directivesByUrl: {
      '/app/foo.directive.js': {foo: [fooDirective]},
      '/app/foo2.directive.js': {foo: [fooDirective2]}
    }};
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);
    angular.bootstrap(element, ['app', provide]);
    element.injector().get('fooDirective');

    listener({
      scriptUrl: '/app/foo.directive.js',
      script: '',
      recipes: ['directive']
    });

    var $injector = element.injector();
    expect($injector.get('fooDirective')).to.have.length(1)
    .and.to.have.property('0', fooDirective2);

    function provide($provide, $compileProvider) {
      provideRoute($provide);
      $compileProvider.directive('foo', valueFn(fooDirective));
      $compileProvider.directive('foo', valueFn(fooDirective2));
    }
  });


  it('should handle directive as object property', function() {
    var fooDirective = {
      compile: angular.noop,
      foo: 'foo'
    };
    window.___bsInjular___ = {directivesByUrl: {'/app/foo.directive.js': {foo: [fooDirective]}}};
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);
    angular.bootstrap(element, ['app', provide]);
    element.injector().get('fooDirective');

    listener({
      scriptUrl: '/app/foo.directive.js',
      script: [
        "angular.module('app')",
        ".directive({foo: function(){return {compile: function(){}, foo: 'bar'};}})"
      ].join(''),
      recipes: ['directive']
    });

    expect(fooDirective).to.have.property('foo', 'bar');

    function provide($provide, $compileProvider) {
      provideRoute($provide);
      $compileProvider.directive('foo', valueFn(fooDirective));
    }
  });


  it('should handle undefined directive', function() {
    var fileDirectives = {};
    window.___bsInjular___ = {directivesByUrl: {'/app/foo.directive.js': fileDirectives}};
    var element = angular.element('<div ng-app="quiet-app"></div>');
    rootElement.append(element);
    angular.bootstrap(element, ['quiet-app', provide]);

    listener({
      scriptUrl: '/app/foo.directive.js',
      script: [
        "angular.module('quiet-app')",
        ".directive('foo', function(){})"
      ].join(''),
      recipes: ['directive']
    });

    expect(fileDirectives).to.not.have.property('foo');

    function provide($provide, $compileProvider) {
      window.___bsInjular___.$compileProvider = $compileProvider;
      provideRoute($provide);
    }
  });


  it('should readd a directive that was previously removed', function() {
    var fooDirective = {
      compile: angular.noop,
      foo: 'bar'
    };
    var directiveList = [fooDirective];
    window.___bsInjular___ = {directivesByUrl: {'/app/foo.directive.js': {foo: directiveList}}};
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);
    angular.bootstrap(element, ['app', provide]);
    element.injector().get('fooDirective');

    listener({
      scriptUrl: '/app/foo.directive.js',
      script: '',
      recipes: ['directive']
    });

    listener({
      scriptUrl: '/app/foo.directive.js',
      script: [
        "angular.module('app')",
        ".directive('foo', function(){return {compile: function(){}, foo: 'bar'};})"
      ].join(''),
      recipes: ['directive']
    });

    expect(fooDirective).to.have.property('foo', 'bar');
    var $injector = element.injector();
    var fooDirectiveFactory = $injector.get('fooDirective');
    expect(fooDirectiveFactory).to.length(1);
    expect(fooDirectiveFactory[0]).to.equal(fooDirective);

    function provide($provide, $compileProvider) {
      window.___bsInjular___.$compileProvider = $compileProvider;
      provideRoute($provide);
      $compileProvider.directive('foo', valueFn(fooDirective));
    }
  });


  if (VERSION_MINOR >= 5) {
    it('should handle component recipe', function() {
      var fooComponent = {
        template: 'foo'
      };
      window.___bsInjular___ = {};
      var element = angular.element('<div ng-app="app"></div>');
      rootElement.append(element);
      angular.bootstrap(element, ['app', provide]);
      var $injector = element.injector();
      var fooDirectives = $injector.get('fooDirective').slice(); // slice for copy
      window.___bsInjular___.directivesByUrl = {'/app/foo.component.js': {foo: fooDirectives}};

      listener({
        scriptUrl: '/app/foo.component.js',
        script: [
          "angular.module('app')",
          ".component('foo', {template: 'bar'})"
        ].join(''),
        recipes: ['directive']
      });

      expect(fooDirectives[0]).to.have.property('template', 'bar');
      expect(fooDirectives[0]).to.have.property('controller');

      function provide($provide, $compileProvider) {
        provideRoute($provide);
        $compileProvider.directive('foo', valueFn(fooComponent));
        window.___bsInjular___.$compileProvider = $compileProvider;
      }
    });
  }

});
