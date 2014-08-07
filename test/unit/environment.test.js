/* global describe, it, beforeEach */

var r7rs    = require('../..');
var Environment = r7rs.Environment;


describe('Environment', function () {

  var env;

  beforeEach(function () {
    env = new Environment();
  });

  describe('#getIndex()', function () {
    it('should return -1 for undefined names', function () {
      env.getIndex('foo').should.eql(-1);
    });

    it('should return the index for defined names', function () {
      env.define('foo', 1);
      env.define('bar', 1);

      env.getIndex('foo').should.eql(0);
      env.getIndex('bar').should.eql(1);
    });

    it('should return the index for symbols defined in parent', function () {
      env.define('foo', 1);
      (new Environment(env)).getIndex('foo').should.eql(0);
    });
  });
});
