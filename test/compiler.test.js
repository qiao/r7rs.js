/*global describe:true, it: true*/

var parse        = require('../src/parser').parse,
    objects      = require('../src/objects'),
    Bool         = objects.Bool,
    ByteVector   = objects.ByteVector,
    Char         = objects.Char,
    Complex      = objects.Complex,
    Nil          = objects.Nil,
    Pair         = objects.Pair,
    Real         = objects.Real,
    Str          = objects.Str,
    Symbol       = objects.Symbol,
    Vector       = objects.Vector,
    compile      = require('../src/compiler').compile;

describe('Compiler', function () {

    function eql(source, opcode) {
        compile(
            parse(source)[0],
            [[], []],
            [],
            { type: 'halt' }
        ).should.eql(opcode);
    }

    it('should compile constants', function () {

        eql('1', {
            type: 'constant',
            object: new Real(1),
            next: { type: 'halt' }
        });
        eql('#t', {
            type: 'constant',
            object: new Bool(true),
            next: { type: 'halt' }
        });
        eql('#f', {
            type: 'constant',
            object: new Bool(false),
            next: { type: 'halt' }
        });
        eql('"str"', {
            type: 'constant',
            object: new Str('str'),
            next: { type: 'halt' }
        });

    });

    it('should compile quotes', function () {

        eql('\'hello', {
            type: 'constant',
            object: new Symbol('hello'),
            next: { type: 'halt' }
        });
        eql('\'(1 2)', {
            type: 'constant',
            object: new Pair(
                new Real(1),
                new Pair(new Real(2), Nil)
            ),
            next: { type: 'halt' }
        });

    });

    it('should compile lambdas', function () {

        eql('(lambda (x) 1)', {
            type: 'close',
            n: 0,
            body: {
                type: 'constant',
                object: new Real(1),
                next: { type: 'return', n: 1 }
            },
            next: { type: 'halt' }
        });

        eql('(lambda (x y) x)', {
            type: 'close',
            n: 0,
            body: {
                type: 'refer-local',
                n: 0,
                next: { type: 'return', n: 2 }
            },
            next: { type: 'halt' }
        });

        eql('(lambda (x) (lambda (y) x))', {
            type: 'close',
            n: 0,
            body: {
                type: 'refer-local',
                n: 0,
                next: {
                    type: 'argument',
                    next: {
                        type: 'close',
                        n: 1,
                        body: {
                            type: 'refer-free',
                            n: 0,
                            next: {
                                type: 'return',
                                n: 1
                            }
                        },
                        next: {
                            type: 'return',
                            n: 1
                        }
                    }
                }
            },
            next: { type: 'halt' }
        });
    });
});
