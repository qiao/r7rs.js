var objects = require('./objects'),
    Nil     = objects.Nil;


function compile(expr, env, next) {
    var first, rest, vars, body, test, thenc, elsec, name, exp,
        conti, args, i, len, func, variadic, variable, expression;

    if (expr.type === 'symbol') {
        return {
            type: 'refer',
            location: compileLookup(expr, env),
            next: next
        };
    } else if (expr.type === 'pair') {

        first = expr.car;
        rest = expr.cdr;

        switch (first.name) {
            case 'quote':
                return {
                    type: 'constant',
                    object: rest.car,
                    next: next
                };
            case 'begin':
                body = rest.toArray();
                for (i = body.length - 1; i >= 0; --i) {
                    next = compile(body[i], env, next);
                }
                return next;
            case 'define': // (define sym exp)
                variable = rest.car;
                expression = rest.cdr.car;
                return compile(expression, env, {
                    type: 'define',
                    variable: variable,
                    next: next
                });
            case 'lambda':
                vars = rest.car;
                body = rest.cdr.car;
                variadic = vars.type === 'symbol' ||
                           (vars.type === 'pair' && !vars.isProperList());
                vars = vars.type === 'symbol' ? [vars] : vars.toArray();
                return {
                    type: 'close',
                    numArgs: vars.length,
                    variadic: variadic,
                    body: compile(body,
                                  [vars].concat(env),
                                  { type: 'return' }),
                    next: next
                };
            case 'if':
                test = rest.car;
                thenc = rest.cdr.car;
                elsec = rest.cdr.cdr.car;

                thenc = compile(thenc, env, next);
                elsec = compile(elsec, env, next);

                return compile(test, env, {
                    type: 'test',
                    then: thenc,
                    'else': elsec
                });
            case 'set!':
                name = rest.car;
                exp = rest.cdr.car;
                return compile(exp, env, {
                    type: 'assign',
                    location: compileLookup(name, env),
                    next: next
                });
            case 'call/cc':
                conti = {
                    type: 'conti',
                    next: {
                        type: 'argument',
                        next: compile(rest.car, env, { type: 'apply' })
                    }
                };
                return isTail(next) ? conti : {
                    type: 'frame', ret: next, next: conti
                };
            default:
                func = compile(first, env, { type: 'apply' });
                for (args = rest; args !== Nil; args = args.cdr) {
                    func = compile(args.car, env, {
                        type: 'argument', next: func
                    });
                }
                return isTail(next) ? func : {
                    type: 'frame',
                    ret: next,
                    next: func
                };
        }
    } else {
        return {
            type: 'constant',
            object: expr,
            next: next
        };
    }
}

function isTail(next) {
    return next.type === 'return';
}

function compileLookup(symbol, env) {
    var i, j, rib;
    for (i = 0; i < env.length; ++i) {
        rib = env[i];
        for (j = 0; j < rib.length; ++j) {
            if (symbol === rib[j]) {
                return {
                    type: 'index',
                    index: [i, j]
                };
            }
        }
    }
    return {
        type: 'symbol',
        symbol: symbol
    };
}

exports.compile = function (expr) {
    return compile(expr, [], { type: 'halt' });
};
