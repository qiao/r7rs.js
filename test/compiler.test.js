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
            ['halt']
        ).should.eql(opcode);
    }

    it('should compile constants', function () {

        eql('1',     ['constant', new Real(1), ['halt']]);
        eql('#t',    ['constant', new Bool(true), ['halt']]);
        eql('#f',    ['constant', new Bool(false), ['halt']]);
        eql('"str"', ['constant', new Str('str'), ['halt']]);

    });

    it('should compile quotes', function () {

        eql('\'hello', ['constant', new Symbol('hello'), ['halt']]);
        eql('\'(1 2)', [
            'constant',
            new Pair(
                new Real(1),
                new Pair(new Real(2), Nil)
            ),
            ['halt']
        ]);

    });

    it('should compile lambdas', function () {

        eql('(lambda (x) 1)', [
            'close',
            0,
            [
                'constant',
                new Real(1),
                ['return', 1]
            ],
            ['halt']
        ]);

        eql('(lambda (x y) x)', [
            'close',
            0,
            [
                'refer-local',
                0,
                ['return', 2]
            ],
            ['halt']
        ]);

        eql('(lambda (x) (lambda (y) x))', [
            'close',
            0,
            [
                'refer-local',
                0,
                [
                    'argument',
                    [
                        'close',
                        1,
                        [
                            'refer-free',
                            0,
                            [
                                'return',
                                1
                            ]
                        ],
                        [
                            'return',
                            1
                        ]
                    ]
                ]
            ],
            ['halt']
        ]);
    });

    it('should compile continuations', function () {

        eql('(call/cc (lambda (k) (k 1)))', [
            "frame",
            ["halt"],
            [
                "conti",
                [
                    "argument",
                    [
                        "close",
                        0,
                        [
                            "constant",
                            new Real(1),
                            [
                                "argument",
                                [
                                    "refer-local",
                                    0,
                                    [
                                        "shift",
                                        1,
                                        1,
                                        [
                                            "apply"
                                        ]
                                    ]
                                ]
                            ]
                        ],
                        [
                            "apply"
                        ]
                    ]
                ]
            ]
        ]);
    });
});
