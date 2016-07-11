'use strict';

const expect = require('chai').expect;
const match = require('../lib/match');


describe('match', () => {
  
  it('should work when providing an array of patterns', () => {
    let matched = match('foo/foo/bar', ['qwerty', 'foo/*/bar', 'azerty']);
    expect(matched).to.equal(true);
  });
  
  it('should work when providing an array of patterns with negative matches', () => {
    let matched;
    let patterns = ['**/*.js', '!foo/*.js', 'foo/bar.js'];
    matched = match('bar/foo.js', patterns);
    expect(matched).to.equal(true, 'path: bar/foo.js');
    matched = match('foo/foo.js', patterns);
    expect(matched).to.equal(false, 'path: foo/foo.js');
    matched = match('foo/bar.js', patterns);
    expect(matched).to.equal(true, 'path: foo/bar.js');
  });

});