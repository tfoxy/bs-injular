'use strict';

describe('fileChanger', function() {
  var fileChanger = window.fileChanger;
  var noop = angular.noop;

  describe('.wrapTemplate', function() {

    it('should return a string that contains the content', function() {
      var content = '<div><span>FOO</span><span>BAR</span</div>';
      var newContent = fileChanger.wrapTemplate(content, '/app/main.html');
      expect(newContent).to.contain(content);
    });

    it('should add a header comment to the content', function() {
      var content = '<div><span>FOO</span><span>BAR</span</div>';
      var newContent = fileChanger.wrapTemplate(content, '/app/main.html');
      expect(newContent).to.startWith('<!--bs-injular-start /app/main.html--><');
    });

    it('should add a footer comment to the content', function() {
      var content = '<div><span>FOO</span><span>BAR</span</div>';
      var newContent = fileChanger.wrapTemplate(content, '/app/main.html');
      expect(newContent).to.endWith('><!--bs-injular-end /app/main.html-->');
    });

    it('should add ie8 line if supportIE8 option is true', function() {
      var content = '<div><span>FOO</span><span>BAR</span</div>';
      var newContent = fileChanger.wrapTemplate(content, '/app/main.html', {
        supportIE8: true
      });
      expect(newContent).to.contain('<!--[if lt IE 9]>');
      expect(newContent).to.contain('<![endif]-->');
    });

  });

  describe('.appendProvideGetter', function() {

    afterEach(function() {
      delete window.___bsInjular___;
    });

    it('should return a string that starts with the string received', function() {
      var content = "angular.module('app').controller(function(){})";
      var newContent = fileChanger.appendProvideGetter(content, 'app');
      expect(newContent).to.startWith(content);
    });

    it('should add $controllerProvider to bsInjular when evaluated', function() {
      var content = fileChanger.appendProvideGetter('', 'app');
      var evaluate = new Function('angular', 'window', content);
      var angular = window.angular.copy(window.angular);

      angular.module('app', []);
      sinon.spy(angular, 'module');
      evaluate(angular, window);
      angular.bootstrap(document.createElement('div'), ['app']);

      expect(angular.module).to.have.callCount(1);
      expect(window.___bsInjular___).to.be.an('object', 'window.___bsInjular___')
      .that.has.property('$controllerProvider');
    });

    it('should add startBsInjular directive if supportIE8 option is true', function() {
      var content = fileChanger.appendProvideGetter('', 'app', {
        supportIE8: true
      });
      var evaluate = new Function('angular', 'window', content);
      var angular = window.angular.copy(window.angular);

      var module = angular.module('app', []);
      var directive = module.directive = sinon.spy();
      sinon.spy(angular, 'module');
      evaluate(angular, window);
      angular.bootstrap(document.createElement('div'), ['app']);

      expect(directive).to.have.callCount(1);
    });

  });

  describe('.appendAngularModulePatch', function() {

    it('should return a string that starts with the string received', function() {
      var content = "(function(){window.angular={}})()";
      var newContent = fileChanger.appendAngularModulePatch(content);
      expect(newContent).to.startWith(content);
    });
    
  });

  describe('_appendAngularModulePatchFunction', function() {
    var angular, currentScriptDiv;

    function setCurrentScript(src) {
      currentScriptDiv.innerHTML = '<script src="' + src + '"></script>';
      return currentScriptDiv.firstChild;
    }

    function bootstrapApp(appName) {
      angular.bootstrap(document.createElement('div'), [appName]);
    }

    before(function() {
      currentScriptDiv = document.createElement('div');
      document.body.appendChild(currentScriptDiv);
    });

    beforeEach(function() {
      angular = window.angular.copy(window.angular);
    });

    afterEach(function() {
      delete window.___bsInjular___;
      currentScriptDiv.innerHTML = '';
    });

    after(function() {
      currentScriptDiv.parentNode.removeChild(currentScriptDiv);
    });

    it('should add directivesByUrl to bsInjular when evaluated', function() {
      fileChanger._appendAngularModulePatchFunction(angular, window);

      expect(window.___bsInjular___).to.be.an('object')
      .that.has.property('directivesByUrl')
      .that.deep.equals({});
    });

    it('should add filtersCache to bsInjular when evaluated', function() {
      fileChanger._appendAngularModulePatchFunction(angular, window);

      expect(window.___bsInjular___).to.be.an('object')
      .that.has.property('filtersCache')
      .that.deep.equals({});
    });

    it('should replace angular.module when evaluated', function() {
      var module = angular.module;

      fileChanger._appendAngularModulePatchFunction(angular, window, document);

      expect(angular.module).to.not.equal(module);
    });

    it('should call original angular.module when evaluated and angular.module is called', function() {
      var module = sinon.spy(angular, 'module');

      fileChanger._appendAngularModulePatchFunction(angular, window, document);
      angular.module('app');

      expect(module).to.have.callCount(1);
    });

    it('should replace module.directive when evaluated and angular.module is called', function() {
      setCurrentScript('/foo.directive.js');
      var directive = angular.module('app', []).directive;
      fileChanger._appendAngularModulePatchFunction(angular, window, document);
      var module = angular.module('app');

      expect(module.directive).to.not.equal(directive);
    });

    it('should replace module.filter when evaluated and angular.module is called', function() {
      var filter = angular.module('app', []).filter;
      fileChanger._appendAngularModulePatchFunction(angular, window);
      var module = angular.module('app');

      expect(module.filter).to.not.equal(filter);
    });

    it('should not replace module.filter twice when angular.module is called twice', function() {
      fileChanger._appendAngularModulePatchFunction(angular, window);
      var filter = angular.module('app', []).filter;
      var module = angular.module('app');

      expect(module.filter).to.equal(filter);
    });

    it('should call original module.directive with an array factory when new module.directive is called', function() {
      setCurrentScript('/foo.directive.js');
      var directive = angular.module('app', []).directive = sinon.spy();
      fileChanger._appendAngularModulePatchFunction(angular, window, document);
      angular.module('app').directive('foo', function() {
        return {};
      });

      expect(directive).to.have.callCount(1);
      expect(directive).to.have.been.calledWith('foo');
      expect(directive.args[0][1]).to.be.an('array').that.has.length(1);
    });

    it('should patch the directive factory in order to add the directive to bsInjular.directivesByUrl', function() {
      var directive;
      setCurrentScript('/foo.directive.js');
      fileChanger._appendAngularModulePatchFunction(angular, window, document);
      angular.module('app', []).directive('foo', function() {
        return { foo: 'bar' };
      }).run(function(fooDirective) {
        directive = fooDirective[0];
      });
      bootstrapApp('app');

      expect(directive).to.have.property('foo', 'bar');
      expect(window.___bsInjular___).to.be.an('object')
      .that.has.property('directivesByUrl')
      .that.has.property('/foo.directive.js')
      .that.has.property('foo')
      .that.has.property('0', directive);
    });

    it('should use the injular-src attribute when it is available', function() {
      var directive;
      setCurrentScript('/foo.directive.js').setAttribute('injular-src', '/bar.directive.js');
      fileChanger._appendAngularModulePatchFunction(angular, window, document);
      angular.module('app', []).directive('foo', function() {
        return { foo: 'bar' };
      }).run(function(fooDirective) {
        directive = fooDirective[0];
      });
      bootstrapApp('app');

      expect(directive).to.have.property('foo', 'bar');
      expect(window.___bsInjular___).to.be.an('object')
      .that.has.property('directivesByUrl')
      .that.has.property('/bar.directive.js')
      .that.has.property('foo')
      .that.has.property('0', directive);
    });

    it('should transform a postlink function directive to a regular one', function() {
      var directive;
      setCurrentScript('/foo.directive.js');
      fileChanger._appendAngularModulePatchFunction(angular, window, document);
      angular.module('app', []).directive('foo', function() {
        return noop;
      }).run(function(fooDirective) {
        directive = fooDirective[0];
      });
      bootstrapApp('app');

      expect(directive).to.be.an('object');
      expect(window.___bsInjular___).to.be.an('object')
      .that.has.property('directivesByUrl')
      .that.has.property('/foo.directive.js')
      .that.has.property('foo')
      .that.has.property('0', directive);
    });

    it('should patch angular.filter with another function that calls the original angular.filter', function() {
      var filterRecipe = angular.module('app', []).filter = sinon.spy();
      fileChanger._appendAngularModulePatchFunction(angular, window);
      angular.module('app').filter('foo', function() {
        return function() { return 'foo'; };
      });

      expect(filterRecipe).to.have.callCount(1);
    });

    it('should patch the filter factory in order to add the filter to bsInjular.filtersCache', function() {
      fileChanger._appendAngularModulePatchFunction(angular, window);
      angular.module('app', []).filter('foo', function() {
        return function() { return 'foo'; };
      }).run(function($filter) {
        $filter('foo');
      });
      bootstrapApp('app');

      expect(window.___bsInjular___).to.be.an('object')
      .that.has.deep.property(
        'filtersCache.foo'
      ).that.is.a('function', '___bsInjular___.filtersCache.foo');
      expect(window.___bsInjular___.filtersCache.foo()).to.equal('foo');
    });

  });

});
