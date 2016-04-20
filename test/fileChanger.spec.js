'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const fileChanger = require('../lib/fileChanger');

describe('fileChanger', () => {

  describe('.wrapTemplate', () => {

    it('should return a string that contains the content', () => {
      let content = '<div><span>FOO</span><span>BAR</span</div>';
      let newContent = fileChanger.wrapTemplate(content, '/app/main.html');
      expect(newContent).to.contain(content);
    });

    it('should add a header comment to the content', () => {
      let content = '<div><span>FOO</span><span>BAR</span</div>';
      let newContent = fileChanger.wrapTemplate(content, '/app/main.html');
      expect(newContent).to.startWith('<!--bs-injular-start /app/main.html-->');
    });

    it('should add a footer comment to the content', () => {
      let content = '<div><span>FOO</span><span>BAR</span</div>';
      let newContent = fileChanger.wrapTemplate(content, '/app/main.html');
      expect(newContent).to.endWith('<!--bs-injular-end /app/main.html-->');
    });

  });

  describe('.appendProvideGetter', () => {

    it('should return a string that starts with the string received', () => {
      let content = `angular.module('app').controller(function(){})`;
      let newContent = fileChanger.appendProvideGetter(content, 'app');
      expect(newContent).to.startWith(content);
    });

    it('should add $controllerProvider to bsInjular when evaluated', () => {
      let content = fileChanger.appendProvideGetter('', 'app');
      let evaluate = new Function('angular', 'window', content);
      let window = {};
      let angular = {
        module: function() {
          return {
            config: function(array) {
              array[array.length-1]('$controllerProvider');
            }
          };
        }
      };
      sinon.spy(angular, 'module');

      evaluate(angular, window);

      expect(angular.module).to.have.callCount(1);
      expect(window).to.have.deep.property(
        '___bsInjular___.$controllerProvider',
        '$controllerProvider'
      );
    });

  });

  describe('.appendAngularDirectivePatch', () => {

    it('should return a string that starts with the string received', () => {
      let content = `(function(){window.angular={}})()`;
      let newContent = fileChanger.appendAngularDirectivePatch(content);
      expect(newContent).to.startWith(content);
    });

    it('should add directivesByUrl to bsInjular when evaluated', () => {
      let content = fileChanger.appendAngularDirectivePatch('');
      let evaluate = new Function('angular', 'window', content);
      let window = {};
      let angular = {
        module: sinon.spy()
      };

      evaluate(angular, window);

      expect(window).to.have.deep.property(
        '___bsInjular___.directivesByUrl'
      ).that.deep.equals({});
    });

    it('should replace angular.module when evaluated', () => {
      let content = fileChanger.appendAngularDirectivePatch('');
      let evaluate = new Function('angular', 'window', content);
      let window = {};
      let module = sinon.spy();
      let angular = {
        module
      };

      evaluate(angular, window);

      expect(angular.module).to.not.equal(module);
    });

  });

});
