var objects      = require('./objects'),
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

function transform(expr) {
    var first, rest;

    if (expr.type === 'symbol') {
        return expr;
    } else if (expr.type === 'pair') {
        first = expr.car;
        rest = expr.cdr;
        switch (first.name) {
            case 'quote':
                return expr;
            case 'begin':
                return new Pair(new Symbol('begin'), transform(rest));
            case 'lambda':
                // (lambda (<var1> <var2> <var3>) <body>)
                // (lambda <var> <body>)
                // (lambda (<var1> <var2> . <rest>) <body>)
        }
    } else { // constant
        return expr;
    }
}

exports.transform = transform;
