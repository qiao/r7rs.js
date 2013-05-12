/*global describe:true, it: true*/

var objects = require('../../src/objects'),
    Real    = objects.Real,
    Pair    = objects.Pair,
    Nil     = objects.Nil;


describe('Pair', function () {

    var pair;

    describe('.getLength()', function () {
        it('should return the length when it\'s a proper list', function () {
            pair = new Pair(new Real(1), Nil);
            pair.getLength().should.equal(1);

            pair = new Pair(new Real(1), new Pair(new Real(2), Nil));
            pair.getLength().should.equal(2);
        });

        it('should raise an error when it\'s not a proper list', function () {
            pair = new Pair(new Real(1), new Real(2));
            (function () {
                pair.getLength();
            }).should.throw();

            pair = new Pair(new Real(1), new Pair(new Real(2), new Real(3)));
            (function () {
                pair.getLength();
            }).should.throw();
        });
    });

    describe('.isProperList()', function () {
        it('should return true when it\'s a proper list', function () {
            pair = new Pair(new Real(1), Nil);
            pair.isProperList().should.be.true;

            pair = new Pair(new Real(1), new Pair(new Real(2), Nil));
            pair.isProperList().should.be.true;
        });

        it('should return false when it\'s not a proper list', function () {
            pair = new Pair(new Real(1), new Real(2));
            pair.isProperList().should.be.false;

            pair = new Pair(new Real(1), new Pair(new Real(2), new Real(3)));
            pair.isProperList().should.be.false;
        });
    });

    describe('.reverse()', function () {
        it('should return the reversed list', function () {
            pair = new Pair(new Real(1), Nil);
            pair.reverse().should.eql(new Pair(new Real(1), Nil));

            pair = new Pair(new Real(1), new Pair(new Real(2), Nil));
            pair.reverse().should.eql(
                new Pair(new Real(2), new Pair(new Real(1), Nil))
            );
        });
    });
});
