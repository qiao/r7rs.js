/* global describe, it */

var r7rs    = require('../../..');
var objects = r7rs.objects;
var Real    = objects.Real;
var Vector  = objects.Vector;


describe('Vector', function () {

  describe('.make()', function () {
    it('should create a vector with the specified length', function () {
      var vector = Vector.make(10);
      vector.getLength().should.eql(10);
    });
  });

  describe('.makeWithFill()', function () {
    it('should create a vector with the specified length and fill', function () {
      var vector = Vector.makeWithFill(10, new Real(42));
      vector.getLength().should.eql(10);
      for (var i = 0; i < 10; ++i) {
        vector.ref(i).should.eql(new Real(42));
      }
    });
  });

  describe('#set()', function () {
    it('should set the value at the specified position', function () {
      var vector = Vector.makeWithFill(10, new Real(42));
      vector.set(0, new Real(0));
      vector.ref(0).should.eql(new Real(0));
    });
  });
});
