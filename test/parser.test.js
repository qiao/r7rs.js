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

    function eql(exp, val) {
        parse(exp)[0].should.eql(val);
    }

    it('should parse numbers', function () {
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

    it('should parse booleans', function () {
        eql('#t'     , true);
        eql('#f'     , false);
        eql('#true'  , true);
        eql('#false' , false);
    });

    it('should parse characters', function () {
        eql('#\\a', new Char('a'));
        eql('#\\A', new Char('A'));
        eql('#\\(', new Char('('));
        eql('#\\ ', new Char(' '));

        eql('#\\alarm'     , new Char('\u0007'));
        eql('#\\backspace' , new Char('\u0008'));
        eql('#\\delete'    , new Char('\u007f'));
        eql('#\\escape'    , new Char('\u001b'));
        eql('#\\newline'   , new Char('\u000a'));
        eql('#\\null'      , new Char('\u0000'));
        eql('#\\return'    , new Char('\u000d'));
        eql('#\\space'     , new Char(' '));
        eql('#\\tab'       , new Char('\u0009'));
    });

    it('should parse strings', function () {
        eql('"\\a"',  new SchemeString('\u0007'));
        eql('"\\b"',  new SchemeString('\u0008'));
        eql('"\\t"',  new SchemeString('\u0009'));
        eql('"\\n"',  new SchemeString('\u000a'));
        eql('"\\r"',  new SchemeString('\u000d'));
        eql('"\\""',  new SchemeString('\u0022'));
        eql('"\\\\"', new SchemeString('\u005c'));

        eql('" \\"recursion\\" "'  , new SchemeString(' "recursion" '));
        eql('"two\nlines"'         , new SchemeString('two\nlines'));
        eql('"one \\ \n    line"'  , new SchemeString('one line'));
        eql('"\\x03bb; is lambda"' , new SchemeString('λ is lambda'));
    });

    it('should parse symbols', function () {
        eql('lambda'       , new Symbol('lambda'));
        eql('q'            , new Symbol('q'));
        eql('soup'         , new Symbol('soup'));
        eql('list->vector' , new Symbol('list->vector'));
        eql('+'            , new Symbol('+'));
        eql('V17a'         , new Symbol('V17a'));
        eql('<='           , new Symbol('<='));
        eql('a34kTMNs'     , new Symbol('a34kTMNs'));
        eql('->-'          , new Symbol('->-'));
        eql('H\\x65;llo'   , new Symbol('Hello'));
    });
});
