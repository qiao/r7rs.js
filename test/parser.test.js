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
    Vector       = objects.Vector;

describe('Parser', function () {

    function eql(exp, val) {
        parse(exp)[0].should.eql(val);
    }

    it('should ignore whitespaces', function () {
        parse('  \t\r\n').should.eql([]);
        parse('   ; this is inline comment').should.eql([]);
    });

    it('should parse numbers', function () {
        eql('42'         , new Real(42));
        eql('#d42'       , new Real(42));
        eql('#b101010'   , new Real(42));
        eql('#o52'       , new Real(42));
        eql('#x2a'       , new Real(42));
        eql('#x2A'       , new Real(42));

        eql('42.0'       , new Real(42.0));
        eql('+4.2e1'     , new Real(42.0));
        eql('.42e2'      , new Real(42.0));
        eql('#d#i420e-1' , new Real(42.0));

        eql('84/2'         , new Real(42.0));
        eql('#d84/2'       , new Real(42.0));
        eql('#b1010100/10' , new Real(42.0));
        eql('#o0124/2'     , new Real(42.0));
        eql('#x54/2'       , new Real(42.0));

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
        eql('#t'     , new Bool(true));
        eql('#f'     , new Bool(false));
        eql('#true'  , new Bool(true));
        eql('#false' , new Bool(false));
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
        eql('"\\a"',  new Str('\u0007'));
        eql('"\\b"',  new Str('\u0008'));
        eql('"\\t"',  new Str('\u0009'));
        eql('"\\n"',  new Str('\u000a'));
        eql('"\\r"',  new Str('\u000d'));
        eql('"\\""',  new Str('\u0022'));
        eql('"\\\\"', new Str('\u005c'));

        eql('" \\"recursion\\" "'  , new Str(' "recursion" '));
        eql('"two\nlines"'         , new Str('two\nlines'));
        eql('"one \\ \n    line"'  , new Str('one line'));
        eql('"\\x03bb; is lambda"' , new Str('λ is lambda'));
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

    it('should parse vectors', function () {
        eql('#(0 1 2)', new Vector([
            new Real(0),
            new Real(1),
            new Real(2)
        ]));

        eql('#("hello" "world" #\\!)', new Vector([
            new Str('hello'),
            new Str('world'),
            new Char('!')
        ]));
    });

    it('should parse bytevectors', function () {
        eql('#u8()', new ByteVector([]));
        eql('#u8(1)', new ByteVector([1]));
        eql('#u8(97 98 99)', new ByteVector([97, 98, 99]));
    });

    it('should parse nil', function () {
        eql('()', Nil);
    });

    it('should parse pairs', function () {
        eql('(1 . 2)', new Pair(new Real(1), new Real(2)));

        eql('(+ 1 2)',
            new Pair(
                new Symbol('+'),
                new Pair(
                    new Real(1),
                    new Pair(new Real(2), Nil)
                )
            )
        );

        eql('(define x 1) ; this is comment',
            new Pair(
                new Symbol('define'),
                new Pair(
                    new Symbol('x'),
                    new Pair(new Real(1), Nil)
                )
            )
        );
    });
});
