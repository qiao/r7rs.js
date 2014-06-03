// compile the intermediate form into CPS.

function compile(expr, env, next) {
    switch (expr.type) {
        case 'ref':
            return compileLookup('ref', expr.symbol, env, next);
        case 'set':
            return compile(expr.expr,
                           env,
                           compileLookup('set', expr.symbol, env, next));
        case 'const':
            return {
                type: 'const',
                value: expr.value,
                next: next
            };
        case 'if':
            return compile(expr.test, env, {
                type: 'test',
                then: compile(expr.then, env, next),
                'else': compile(expr.else, env, next),
            });
        case 'define':
            return compile(expr.expr, env, {
                type: 'define',
                id: expr.id,
                next: next
            });
        case 'lambda':
            return {
                type: 'close',
                nargs: expr.args.length,
                variadic: expr.variadic,
                body: compile(expr.body,
                              [expr.args].concat(env),
                              { type: 'return' }),
                next: next
            };
        case 'call':
            return compileCall(expr, env, next);
        case 'seq':
            return compileSeq(expr, env, next);
        case 'add':
            return {
                type: 'close'
            };
    }
}


function compileLookup(type, sym, env, next) {
    var depth, offset, rib;

    for (depth = 0; depth < env.length; ++depth) {
        rib = env[depth];
        for (offset = 0; offset < rib.length; ++offset) {
            if (rib[offset] === sym) {
                return {
                    type: 'l' + type,
                    depth: depth,
                    offset: offset,
                    next: next
                };
            }
        }
    }

    return {
        type: 'g' + type,
        id: sym,
        index: -1,
        next: next
    };
}


function compileCall(expr, env, next) {
    var proc, args, i, ret, isTail;

    proc = expr.proc;
    args = expr.args;

    ret = compile(proc, env, { type: 'apply' });

    for (i = args.length - 1; i >= 0; --i) {
        ret = compile(args[i], env, {
            type: 'arg',
            i: i,
            next: ret
        });
    }

    isTail = next.type === 'return';
    return isTail ? ret : {
        type: 'frame',
        nargs: args.length,
        ret: next,
        next: ret
    };
}


function compileSeq(expr, env, next) {
    var body, i;

    body = expr.body;

    for (i = body.length - 1; i >= 0; --i) {
        next = compile(body[i], env, next);
    }

    return next;
}


exports.compile = function (expr) {
    return compile(expr, [], { type: 'halt' });
};
