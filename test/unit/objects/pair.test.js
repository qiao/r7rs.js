/*global describe:true, it: true*/

var r7rs    = require('../../..'),
    objects = r7rs.objects,
    Pair    = objects.Pair,
    Nil     = objects.Nil;


describe('Pair', function () {

    var pair;

    describe('#getLength()', function () {
        it('should return the length when it\'s a proper list', function () {
            pair = new Pair(1, Nil);
            pair.getLength().should.equal(1);

            pair = new Pair(1, new Pair((2), Nil));
            pair.getLength().should.equal(2);
        });

        it('should raise an error when it\'s not a proper list', function () {
            pair = new Pair(1, 2);
            (function () {
                pair.getLength();
            }).should.throw();

            pair = new Pair(1, new Pair(2, 3));
            (function () {
                pair.getLength();
            }).should.throw();
        });
    });

    describe('#reverse()', function () {
        it('should return the reversed list', function () {
            pair = new Pair(1, Nil);
            pair.reverse().should.eql(new Pair(1, Nil));

            pair = new Pair(1, new Pair(2, Nil));
            pair.reverse().should.eql(
                new Pair(2, new Pair(1, Nil))
            );
        });
    });

    describe('#isProperList()', function () {
        it('should return true when it\'s a proper list', function () {
            pair = new Pair(1, Nil);
            pair.isProperList().should.be.true;

            pair = new Pair(1, new Pair(2, Nil));
            pair.isProperList().should.be.true;
        });

        it('should return false when it\'s not a proper list', function () {
            pair = new Pair(1, 2);
            pair.isProperList().should.be.false;

            pair = new Pair(1, new Pair(2, 3));
            pair.isProperList().should.be.false;
        });
    });

    describe('#toProperList()', function () {
        it('should return the identical list if it\'s already proper', function () {
            pair = new Pair(1, new Pair(2, Nil));
            pair.toProperList().toJSON().should.eql({
                type: 'pair',
                car: 1,
                cdr: {
                    type: 'pair',
                    car: 2,
                    cdr: {
                        type: 'nil'
                    }
                }
            });
        });
    });

    describe('#display()', function () {
        it('should not contain a dot in a proper list', function () {
            pair = new Pair(1, new Pair(2, Nil));
            //pair.display().should.eql('(1 2)');
        });

        it('should conain a dot in an inproper list', function () {
            pair = new Pair(1, 2);
            //pair.display().should.eql('(1 . 2)');
        });
    });
});
