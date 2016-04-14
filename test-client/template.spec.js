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

});
