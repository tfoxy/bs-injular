/* global expect sinon */

(function() {
  'use strict';

  function expectAux(obj) {
    var val = new expect.Assertion(obj);
    val.have = val;
    val.has = val;
    val.to = val;
    val.that = val;
    val.been = val;
    val.is = val;
    val.be = val;
    val.deep = new expect.Assertion(obj);
    val.deep.equal = val.deep.eql;
    val.deep.equals = val.deep.eql;
    val.deep.property = deepProperty;
    return val;
  }
  for (var key in expect) {
    expectAux[key] = expect[key];
  }
  expect = expectAux;

  var p = expect.Assertion.prototype;
  p.callCount = callCount;
  p.calledWith = calledWith;
  p.startWith = startWith;
  p.endWith = endWith;
  p.include = p.contain;
  p.contains = p.contain;
  p.origProperty = p.property;
  p.property = property;
  p.equals = p.equal;

  p['throw'] = function(err) {
    var catchedErr, throwsErr, equalsErr;
    try {
      this.obj();
      throwsErr = false;
    } catch(auxErr) {
      catchedErr = auxErr;
      throwsErr = true;
      if (typeof err === 'string') {
        equalsErr = catchedErr.message.indexOf(err) >= 0;
      } else {
        equalsErr = catchedErr instanceof err;
      }
    }
    this.assert(
        throwsErr && equalsErr
      , function(){ return 'expected ' + this.obj + ' to throw ' + err; }
      , function(){ return 'expected ' + this.obj + ' to not throw ' + err; });
    return expect(catchedErr);
  };

  function callCount(count) {
    sinon.assert.callCount(this.obj, count);
    return this;
  }

  function calledWith(args) {
    sinon.assert.calledWith(this.obj, args);
    return this;
  }

  function startWith(obj) {
    this.assert(
        strStartsWith(this.obj, obj)
      , function(){ return 'expected ' + this.obj + ' to start with ' + obj; }
      , function(){ return 'expected ' + this.obj + ' to not start with ' + obj; });
    return this;
  }

  function endWith(obj) {
    this.assert(
        strEndsWith(this.obj, obj)
      , function(){ return 'expected ' + this.obj + ' to end with ' + obj; }
      , function(){ return 'expected ' + this.obj + ' to not end with ' + obj; });
    return this;
  }

  function property(obj) {
    var val = this.origProperty(obj);
    return expect(val.obj);
  }

  function deepProperty(keysStr, propVal) {
    var keys = keysStr.split('.');
    var obj = this.obj;
    var i, key;
    for (i = 0; i < keys.length - 1; i++) {
      key = keys[i];
      expect(obj).to.have.property(key);
      obj = obj[key];
    }
    key = keys[i];
    return expect(obj).to.have.property(key, propVal);
  }

  function strStartsWith(myStr, searchString) {
    return myStr.lastIndexOf(searchString, 0) === 0;
  }

  function strEndsWith(myStr, searchString) {
    return myStr.indexOf(searchString, myStr.length - searchString) >= 0;
  }
})();
