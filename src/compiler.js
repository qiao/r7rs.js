var objects = require('./objects'),
    Nil     = objects.Nil,
    TopLevel = require('./toplevel');

/**
 * Compile the expression into the intermediate form that can be executed by
 * the interpreter. The strategies includes:
 * 
 *   1. CPS Transformation
 *   2. Reference Optimization
 *
 *
 * 1. CPS Transformation
 * ---------------------
 *
 * TBD
 *
 *
 * 2. Reference Optimization
 * -------------------------
 *
 * The compiler maintains a compile-time environment and
 * subsitutes the variables by their locations in the environment, so as to
 * optimize the lookup speed in the interpreter. 
 * Consider the following expression:
 *
 *   (lambda (x y)
 *     (lambda (z)
 *       (+ x y z)))
 *
 * We can substitute the `x` and `y` on the last line by their depth in the
 * lexcial scope and index in the argument list. For example, focusing on the
 * last line, the variable `z` is defined in the direct enclosing lambda, 
 * thus has a depth of 0, and since it's the first argument in the lambda 
 * where it's defined, its index is 0. As for `y`, it's not defined in the
 * direct enclosing lambda, but the parent one, therefore it has a depth of 1.
 * And since `y` is the second argument in the lambda where it's defined, 
 * its index is 1.
 * Therefore, the original expression can be transformed into something like
 * the following. Note that it's just an illustration for conveying the idea;
 * It's not the real output.
 *
 *   (lambda (x y)
 *     (lambda (z)
 *       (+ [1, 0] [1, 1] [0, 0])))
 *
 * The compile-time environment is represented as an array of array, in which
 * each sub-array represents an argument list(a.k.a. value rib). Take the above
 * expression as example again. Initially, the environment is an empty
 * array, []. When the compiler encounters the outer lambda, it creates an
 * argument list and insert it into the environment. So the environment becomes
 * [[x, y]]. And when evaluating the inner lambda, it inserts another arugment 
 * list, and the environment becomes [[z], [x, y]].
 * Therefore, we can use [1, 0] to reference `x`, [1, 1] to reference `y` and
 * [0, 0] to reference `z`.
 *
 * @param {*} expr The expression to compile.
 * @param {Array} env The compile-time environment.
 * @param {Object} next The next opeartion to execute.
 */
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
        type: 'global',
        symbol: symbol,
        index: -1,
    };
}

exports.compile = function (exprs) {
    var i, len, expr, opcodes = [];

    for (i = 0, len = exprs.length; i < len; ++i) {
        opcodes.push(compile(exprs[i], [], { type: 'halt' }));
    }

    return opcodes;
};
