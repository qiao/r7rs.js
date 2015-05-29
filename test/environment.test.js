/* global describe, it, beforeEach */

var r7rs    = require('../..');
var objects = r7rs.objects;
var Symbol  = objects.Symbol;
var Environment = r7rs.Environment;


describe('Environment', function () {

  var env;

  beforeEach(function () {
    env = new Environment();
  });

  describe('#getIndex()', function () {
    it('should return -1 for undefined symbols', function () {
      var symbol = new Symbol('foo');
      env.getIndex(symbol).should.eql(-1);
    });

    it('should return the index for defined symbols', function () {
      var foo = new Symbol('foo'),
      bar = new Symbol('bar');

      env.define(foo, 1);
      env.define(bar, 1);

      env.getIndex(foo).should.eql(0);
      env.getIndex(bar).should.eql(1);
    });

    it('should return the index for symbols defined in parent', function () {
      var foo = new Symbol('foo');

      env.define(foo, 1);
      (new Environment(env)).getIndex(foo).should.eql(0);
    });
  });
});
