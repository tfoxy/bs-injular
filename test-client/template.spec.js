'use strict';

describe('template changed listener', function() {
  var TEMPLATE_CHANGED_EVENT = 'injularTemplate:changed';
  var bs = window.___browserSync___;
  var listener = bs.__events[TEMPLATE_CHANGED_EVENT];
  var rootElement, warn;

  before(function() {
    var body = angular.element(document.body);
    rootElement = angular.element('<div></div>');
    body.append(rootElement);

    warn = console.warn;
    console.warn = sinon.spy();
  });

  afterEach(function() {
    rootElement.children().remove();
    console.warn.reset();
  });

  after(function() {
    rootElement.remove();
    console.warn = warn;
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
    expect(console.warn).to.have.callCount(0);
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
    expect(console.warn).to.have.callCount(0);
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
      listener({
        template: '',
        templateUrl: '/app/foo.html'
      });

      expect(console.warn).to.have.callCount(1);
      expect(console.warn).to.have.been.calledWithMatch('querySelector');
    });

  });


  it('should print a warning when an [ng-app] element is not found', function() {
    listener({
      template: '',
      templateUrl: '/app/foo.html'
    });

    expect(console.warn).to.have.callCount(1);
    expect(console.warn).to.have.been.calledWithMatch('[ng-app]');
    expect(console.warn).to.not.have.been.calledWithMatch('$injector');
  });


  it('should give a warning when $injector is not found', function() {
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);

    listener({
      template: '',
      templateUrl: '/app/foo.html'
    });

    expect(console.warn).to.have.callCount(1);
    expect(console.warn).to.have.been.calledWithMatch('$injector');
  });


  it('should give a warning when templaceCache is not found', function() {
    var element = angular.element('<div ng-app="app"></div>');
    rootElement.append(element);
    angular.bootstrap(element);

    listener({
      template: '',
      templateUrl: '/app/foo.html'
    });

    expect(console.warn).to.have.callCount(1);
    expect(console.warn).to.have.been.calledWithMatch('templateCache');
  });


  it('should print a warning when a bs-injular-end comment is not found', function() {
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
    angular.bootstrap(element);
    element.injector().get('$templateCache').put('/app/foo.html', template);

    listener({
      template: '',
      templateUrl: '/app/foo.html'
    });

    expect(console.warn).to.have.callCount(1);
    expect(console.warn).to.have.been.calledWithMatch('bs-injular-end');
  });

});
