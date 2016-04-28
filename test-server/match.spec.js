'use strict';

const expect = require('chai').expect;
const match = require('../lib/match');


describe('match', () => {
  
  it('should work when providing an array of patterns', () => {
    let matched = match('foo/foo/bar', ['qwerty', 'foo/*/bar', 'azerty']);
    expect(matched).to.equal(true);
  });

});