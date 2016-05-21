'use strict';

const expect = require('chai').expect;
const getUrlFromPathFunction = require('../lib/getUrlFromPathFunction');


describe('getUrlFromPathFunction', () => {
  
  it('should return a function', () => {
    expect(getUrlFromPathFunction()).to.be.a('function');
  });
  
  it('should strip the cwd from the path', () => {
    let cwd = '/home/foo';
    let filepath = '/home/foo/dir/bar.txt';
    let url = getUrlFromPathFunction(cwd, [])(filepath);
    expect(url).to.equal('/dir/bar.txt');
  });
  
  it('should strip the baseDir from the path', () => {
    let baseDirs = ['foo/src'];
    let filepath = 'foo/src/dir/bar.txt';
    let url = getUrlFromPathFunction('', baseDirs)(filepath);
    expect(url).to.equal('/dir/bar.txt');
  });
  
  it('should work with a relative leading dot baseDir', () => {
    let baseDirs = ['./foo/src'];
    let filepath = 'foo/src/dir/bar.txt';
    let url = getUrlFromPathFunction('', baseDirs)(filepath);
    expect(url).to.equal('/dir/bar.txt');
  });

});