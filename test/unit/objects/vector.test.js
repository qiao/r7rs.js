/* global describe, it */

var r7rs    = require('../../..'),
    objects = r7rs.objects,
    Real    = objects.Real,
    Vector  = objects.Vector;


describe('Vector', function () {
    
    var vector;

    describe('.make()', function () {
        it('should create a vector with the specified length', function () {
            vector = Vector.make(10);
            vector.getLength().should.eql(10);
        });
    });

    describe('.makeWithFill()', function () {
        it('should create a vector with the specified length and fill', function () {
            vector = Vector.makeWithFill(10, new Real(42));
            vector.getLength().should.eql(10);
            for (var i = 0; i < 10; ++i) {
                  vector.ref(i).should.eql(new Real(42));
            }
        });
    });

    describe('#set()', function () {
        it('should set the value at the specified position', function () {
            vector = Vector.makeWithFill(10, new Real(42));
            vector.set(0, new Real(0));
            vector.ref(0).should.eql(new Real(0));
        });
    });
});
