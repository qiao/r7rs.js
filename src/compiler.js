var objects = require('./objects'),
    Nil     = objects.Nil;


function compile(expr, env, next) {
    var first, rest, vars, body, test, thenc, elsec, name, exp,
        conti, args, i, len, func;

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
            case 'lambda':
                vars = rest.car;
                body = rest.cdr.car;
                return {
                    type: 'close',
                    body: compile(body,
                                  env.concat([vars.toArray()]),
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
                return compile(expr, env, {
                    type: 'assign',
                    location: compileLookup(name, env),
                    next: next
                });
            case 'call/cc':
                conti = {
                    type: 'conti',
                    next: {
                        type: 'argument',
                        next: compile(expr, env, { type: 'apply' })
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

function compileLookup(name, env) {
    var i, j, rib;
    for (i = 0; i < env.length; ++i) {
        rib = env[i];
        for (j = 0; j < rib.length; ++j) {
            if (name === rib[j]) {
                return [i, j];
            }
        }
    }
    return null;
}

exports.compile = function (expr) {
    return compile(expr, [[], []], { type: 'halt' });
};
