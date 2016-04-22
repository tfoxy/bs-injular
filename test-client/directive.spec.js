'use strict';

describe('directive changed listener', function() {
  var DIRECTIVE_CHANGED_EVENT = 'injularScript:changed';
  var bs = window.___browserSync___;
  var listener = bs.__events[DIRECTIVE_CHANGED_EVENT];
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


  it('should replace directive with injected one', function() {
    var fooDirective = {
      compile: angular.noop,
      $foo: 'bar'
    };
    window.___bsInjular___ = {directivesByUrl: {'/app/foo.directive.js': {foo: [fooDirective]}}};
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);
    angular.bootstrap(element, ['app', provideRoute, provideDirective]);

    listener({
      scriptUrl: '/app/foo.directive.js',
      script: "angular.module('app').directive('foo', function(){return {compile: function(){}, $bar: 'foo'};})"
    });

    expect(fooDirective).to.have.property('$bar', 'foo');
    expect(fooDirective).to.not.have.property('$foo');
    expect(fooDirective).to.have.property('compile').that.not.equals(angular.noop);

    function provideRoute($provide) {
      $provide.constant('$route', {reload: angular.noop});
    }

    function provideDirective($compileProvider) {
      $compileProvider.directive('foo', fooDirective);
    }
  });

});
