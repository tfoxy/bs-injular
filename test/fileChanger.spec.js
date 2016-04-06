'use strict';

const expect = require('chai').expect;
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

  });

});
