/*global describe:true, it: true*/

var parse        = require('../src/parser').parse,
    objects      = require('../src/objects'),
    ByteVector   = objects.ByteVector,
    Char         = objects.Char,
    Complex      = objects.Complex,
    Nil          = objects.Nil,
    Pair         = objects.Pair,
    SchemeString = objects.SchemeString,
    Symbol       = objects.Symbol,
    Vector       = objects.Vector;

describe('Parser', function () {

    it('should ignore whitespaces', function () {
        parse('  \t\r\n').should.eql([]);
        parse('   ; this is inline comment').should.eql([]);
    });


    it('should parse numbers', function () {

        function eql(exp, val) {
            parse(exp)[0].should.eql(val);
        }

        eql('42'         , 42);
        eql('#d42'       , 42);
        eql('#b101010'   , 42);
        eql('#o52'       , 42);
        eql('#x2a'       , 42);
        eql('#x2A'       , 42);

        eql('42.0'       , 42.0);
        eql('+4.2e1'     , 42.0);
        eql('.42e2'      , 42.0);
        eql('#d#i420e-1' , 42.0);

        eql('84/2'         , 42.0);
        eql('#d84/2'       , 42.0);
        eql('#b1010100/10' , 42.0);
        eql('#o0124/2'     , 42.0);
        eql('#x54/2'       , 42.0);

        eql('4+2i'         , new Complex(4, 2));
        eql('#d4+2i'       , new Complex(4, 2));
        eql('#b100+10i'    , new Complex(4, 2));
        eql('#o4+2i'       , new Complex(4, 2));
        eql('#x4+2i'       , new Complex(4, 2));
        
        eql('8/2-4/2i'          , new Complex(4, -2));
        eql('#d8/2-4/2i'        , new Complex(4, -2));
        eql('#b1000/10-100/10i' , new Complex(4, -2));
        eql('#o020/4-20/10i'    , new Complex(4, -2));
        eql('#x010/4-10/8i'     , new Complex(4, -2));

        eql('42+i'       , new Complex(42, 1));
        eql('#d42+i'     , new Complex(42, 1));
        eql('#b101010+i' , new Complex(42, 1));
        eql('#o52+i'     , new Complex(42, 1));
        eql('#x2a+i'     , new Complex(42, 1));

        eql('42-i'       , new Complex(42, -1));
        eql('#d42-i'     , new Complex(42, -1));
        eql('#b101010-i' , new Complex(42, -1));
        eql('#o52-i'     , new Complex(42, -1));
        eql('#x2a-i'     , new Complex(42, -1));

        eql('42+inf.0i'       , new Complex(42, Infinity));
        eql('#d42+inf.0i'     , new Complex(42, Infinity));
        eql('#b101010+inf.0i' , new Complex(42, Infinity));
        eql('#o52+inf.0i'     , new Complex(42, Infinity));
        eql('#x2a+inf.0i'     , new Complex(42, Infinity));

        eql('#x2a-inf.0i'     , new Complex(42, -Infinity));
        eql('42-inf.0i'       , new Complex(42, -Infinity));
        eql('#d42-inf.0i'     , new Complex(42, -Infinity));
        eql('#b101010-inf.0i' , new Complex(42, -Infinity));
        eql('#o52-inf.0i'     , new Complex(42, -Infinity));

        eql('+42i'       , new Complex(0, 42));
        eql('#d+42i'     , new Complex(0, 42));
        eql('#b+101010i' , new Complex(0, 42));
        eql('#o+52i'     , new Complex(0, 42));
        eql('#x+2ai'     , new Complex(0, 42));
        eql('+42i'       , new Complex(0, 42));
        eql('#d+42i'     , new Complex(0, 42));
        eql('#b+101010i' , new Complex(0, 42));
        eql('#o+52i'     , new Complex(0, 42));
        eql('#x+2ai'     , new Complex(0, 42));

        eql('+inf.0i' , new Complex(0, Infinity));
        eql('-inf.0i' , new Complex(0, -Infinity));

        eql('+i', new Complex(0, 1));
        eql('-i', new Complex(0, -1));
    });
});
