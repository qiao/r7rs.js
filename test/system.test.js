/*global describe:true, it: true*/

var r7rs       = require('..'),
    evaluate   = r7rs.evaluate,
    objects    = r7rs.objects,
    Bool       = objects.Bool,
    ByteVector = objects.ByteVector,
    Char       = objects.Char,
    Complex    = objects.Complex,
    Nil        = objects.Nil,
    Pair       = objects.Pair,
    Real       = objects.Real,
    Str        = objects.Str,
    Symbol     = objects.Symbol,
    Vector     = objects.Vector;

describe('System Testing', function () {

    function eql(source, val) {
        evaluate(source).should.eql(val);
    }

    it('should evaluate atoms', function () {
        eql('42', new Real(42));
        eql('4.2', new Real(4.2));

        eql('"hello"', new Str('hello'));
    });

    it('should evaluate simple applications', function () {
        eql('(+ 4 2)', new Real(6));
    });

    it('should evaluate nested applications', function () {
        eql('(+ (+ (+ 4 2) 4) 2)', new Real(12));
    });

    it('should evaluate continuations', function () {
        eql('(call/cc (lambda (k) (k 42)))', new Real(42));
    });

    it('should evaluate assignments', function () {
        eql('((lambda (x) (begin (set! x 4) x)) 2)', new Real(4));
    });

    it('should evaluate closures', function () {
        eql('(((lambda (x) (lambda (y) (+ x y))) 4) 2)', new Real(6));
    });
});
