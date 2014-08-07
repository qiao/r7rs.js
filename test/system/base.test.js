/*global describe:true, it: true*/

var r7rs       = require('../..');
var evaluate   = r7rs.evaluate;
var objects    = r7rs.objects;
var Bool       = objects.Bool;
var ByteVector = objects.ByteVector;
var Char       = objects.Char;
var Complex    = objects.Complex;
var Nil        = objects.Nil;
var Pair       = objects.Pair;
var Real       = objects.Real;
var Str        = objects.Str;
var Symbol     = objects.Symbol;
var Vector     = objects.Vector;

describe('System Testing', function () {

  function eql(source, val) {
    evaluate(source).should.eql(val);
  }

  it('should evaluate atoms', function () {
    eql('42', new Real(42));
    eql('4.2', new Real(4.2));

    eql('"hello"', new Str('hello'));

    eql("'hello", new Symbol('hello'));
    eql("'42", new Real(42));
  });

  it('should evaluate simple applications', function () {
    eql('(+ 4 2)', new Real(6));
  });

  it('should evaluate nested applications', function () {
    eql('(+ (+ (+ 4 2) 4) 2)', new Real(12));
  });

  it('should evaluate conditionals', function () {
    eql('(if #t 4 2)', new Real(4));
    eql('(if 1 4 2)', new Real(4));
    eql('(if 0 4 2)', new Real(4));
    eql('(if \'() 4 2)', new Real(4));
    eql('(if #f 4 2)', new Real(2));
    eql('(if #t (if #t 4 2) (if #t 4 2))', new Real(4));
    eql('(if #t (if #f 4 2) (if #t 4 2))', new Real(2));
    eql('(if #f (if #t 4 2) (if #t 4 2))', new Real(4));
    eql('(if #f (if #t 4 2) (if #f 4 2))', new Real(2));
  });

  it('should evaluate continuations', function () {
    eql('(call/cc (lambda (k) (k 42)))', new Real(42));
  });

  it('should evaluate assignments', function () {
    eql('((lambda (x) (begin (set! x 4) x)) 2)', new Real(4));
  });

  it('should evaluate closures', function () {
    eql('((lambda (x) x) 42)', new Real(42));
    eql('((lambda () 42))', new Real(42));
    eql('(((lambda (x) (lambda (y) (+ x y))) 4) 2)', new Real(6));
  });

  it('should evaluate variadic closures', function () {
    eql('((lambda x x) 1 2)',
        new Pair(new Real(1), new Pair(new Real(2), Nil)));
    eql('((lambda (x y . z) z) 1 2 3 4)',
        new Pair(new Real(3), new Pair(new Real(4), Nil)));
  });
});
