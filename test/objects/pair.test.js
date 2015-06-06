/* global describe, it */

var r7rs    = require('../..');
var objects = r7rs.objects;
var Real    = objects.Real;
var Pair    = objects.Pair;
var NIL     = objects.NIL;


describe('Pair', function () {

  describe('#getLength()', function () {
    it('should return the length', function () {
      var pair = new Pair(new Real(1), NIL);
      pair.getLength().should.equal(1);

      pair = new Pair(new Real(1), new Pair(new Real(2), NIL));
      pair.getLength().should.equal(2);

      pair = new Pair(new Real(1), new Pair(new Real(2), new Real(3)));
      pair.getLength().should.equal(3);
    });
  });

  describe('#reverse()', function () {
    it('should return the reversed list', function () {
      var pair = new Pair(new Real(1), NIL);
      pair.reverse().should.eql(new Pair(new Real(1), NIL));

      pair = new Pair(new Real(1), new Pair(new Real(2), NIL));
      pair.reverse().should.eql(
        new Pair(new Real(2), new Pair(new Real(1), NIL))
      );
    });
  });

  describe('#isProperList()', function () {
    it('should return true when it\'s a proper list', function () {
      var pair = new Pair(new Real(1), NIL);
      pair.isProperList().should.be.true;

      pair = new Pair(new Real(1), new Pair(new Real(2), NIL));
      pair.isProperList().should.be.true;
    });

    it('should return false when it\'s not a proper list', function () {
      var pair = new Pair(new Real(1), new Real(2));
      pair.isProperList().should.be.false;

      pair = new Pair(new Real(1), new Pair(new Real(2), new Real(3)));
      pair.isProperList().should.be.false;
    });
  });

  describe('#toProperList()', function () {
    it('should return the identical list if it\'s already proper', function () {
      var pair = new Pair(new Real(1), new Pair(new Real(2), NIL));
      pair.toProperList().should.eql(pair);
    });
  });

  describe('#display()', function () {
    it('should not contain a dot in a proper list', function () {
      var pair = new Pair(new Real(1), new Pair(new Real(2), NIL));
      pair.display().should.eql('(1 2)');
    });

    it('should conain a dot in an inproper list', function () {
      var pair = new Pair(new Real(1), new Real(2));
      pair.display().should.eql('(1 . 2)');
    });
  });
});
