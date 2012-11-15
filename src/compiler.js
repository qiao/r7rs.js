var objects = require('./objects'),
    Nil     = objects.Nil;


function compile(expr, env, assigned, next) {
    var isAssigned, first, rest, obj, vars, body, free, sets,
        test, thenc, elsec, name, exp, conti, args, func;

    if (expr.type === 'symbol') {
        isAssigned = (assigned.indexOf(expr) >= 0);
        return compileRefer(expr, env, isAssigned ? ['indirect', next] : next);
    } else if (expr.type === 'pair') {
        first = expr.car;
        rest = expr.cdr;
        switch (first.name) {
            case 'quote': // (quote obj)
                return ['constant', rest.car, next];
            case 'lambda': // (lambda vars body)
                vars = rest.car;
                body = rest.cdr;
                free = findFree(body, vars.toArray());
                sets = findSets(body, vars.toArray());
                return collectFree(
                    free, env,
                    ['close', free.length,
                     (makeBoxes(sets, vars,
                                compile(body, [vars.toArray(), free],
                                        setUnion(sets,
                                                 setIntersect(assigned, free)),
                                        ['return', vars.length()]))),
                     next]
                );
            case 'if': // (if test thenc elsec)
                test = rest.car;
                thenc = rest.cdr.car;
                elsec = rest.cdr.cdr.car;
                thenc = compile(thenc, env, assigned, next);
                elsec = compile(elsec, env, assigned, next);
                return compile(test, env, assigned, ['test', thenc, elsec]);
            case 'set!': // (set! name exp)
                name = rest.car;
                exp = rest.cdr.car;
                return compileLookup(
                    name, env,
                    function (n) {
                        return compile(exp, env, assigned,
                                       ['assign-local', n, next]);
                    },
                    function (n) {
                        return compile(exp, env, assigned,
                                       ['assign-free', n, next]);
                    }
                );
            case 'call/cc': // (call/cc exp)
                exp = rest.car;
                conti = ['conti',
                         ['argument',
                          compile(exp, env, assigned,
                                  isTail(next) ?
                                      ['shift', 1, exp, ['apply']] :
                                      ['apply'])]];
                return isTail(next) ? conti : ['frame', next, conti];
            default: // (func args)
                args = rest;
                func = compile(
                    first, env, assigned,
                    isTail(next) ?
                        ['shift', args.length(), next[1], ['apply']] :
                        ['apply']
                );
                while (args !== Nil) {
                    func = compile(args.car, env, assigned, ['argument', func]);
                    args = args.cdr;
                }
                return isTail(next) ? func : ['frame', next, func];
        }
    } else { // constant
        return ['constant', expr, next];
    }
}


/**
 * Determine whether the next instruction is a tail call.
 *
 * @param next {Array}
 * @return bool
 */
function isTail(next) {
    return next[0] === 'return';
}

/**
 * Collect the free variables for inclusion in the closure.
 *
 * @param vars {Array}
 * @param env {Array}
 * @param next {Array}
 */
function collectFree(vars, env, next) {
    var i, len;
    for (i = 0, len = vars.length; i < len; ++i) {
        next = compileRefer(vars[i], env, ['argument', next]);
    }
    return next;
}

/**
 * The help function `compileRefer` is used by the compiler for variable
 * references and by `collectFree` to collect free variable values.
 */
function compileRefer(expr, env, next) {
    var returnLocal = function (n) {
            return ['refer-local', n, next];
        },
        returnFree = function (n) {
            return ['refer-free', n, next];
        };
    return compileLookup(expr, env, returnLocal, returnFree);
}

/**
 */
function compileLookup(expr, env, returnLocal, returnFree) {
    // A compile-time environment is an array of two elements, whose
    // first element is an array of local variables and the whose
    // second element is an array of the free variables.
    var locals = env[0],
        free = env[1],
        n;

    n = locals.indexOf(expr);
    if (n >= 0) {
        return returnLocal(n);
    } else {
        n = free.indexOf(expr);
        return returnFree(n);
    }
}

/**
 * Return the union of two sets.
 * Each set is represented by an array.
 */
function setUnion(sa, sb) {
    var union, item, i, len;

    // create a shallow copy of sa
    union = sa.slice(0);

    // for each item in sb, if it's NOT in sa,
    // then push it into the new set.
    for (i = 0, len = sb.length; i < len; ++i) {
        item = sb[i];
        if (sa.indexOf(item) === -1) {
            union.push(item);
        }
    }

    return union;
}

/**
 * Return the minus of two sets.
 * Each set is represented by an array.
 */
function setMinus(sa, sb) {
    var minus = [],
        item, i, len;

    // for each item in sa, if it's NOT in sb,
    // then push it into the new set.
    for (i = 0, len = sa.length; i < len; ++i) {
        if (sb.indexOf(item) === -1) {
            minus.push(item);
        }
    }

    return minus;
}


/**
 * Return the intersect of two sets.
 * Each set is represented by an array.
 */
function setIntersect(sa, sb) {
    var inter = [],
        item, i, len;

    // for each item in sa, if it is ALSO in sb,
    // then push it into the new set.
    for (i = 0, len = sa.length; i < len; ++i) {
        if (sb.indexOf(item) >= 0) {
            inter.push(item);
        }
    }

    return inter;
}


/**
 * Find the set of free variables of an expression `expr`, given
 * an initial set of bound variables `vars`.
 *
 * @param expr {Pair} An expression in which free variables are being searched.
 * @param vars {Array} An array of variables to search.
 * @return free An array of the free variables.
 */
function findFree(expr, vars) {
    var rest, args, body, test, thenc, elsec, name, exp, set;

    if (expr.type === 'symbol') {
        if (vars.indexOf(expr) >= 0) {
            return [];
        } else {
            return [expr];
        }
    } else if (expr.type === 'pair') {
        rest = expr.cdr;
        switch(expr.car.name) {
            case 'quote': // (quote obj)
                return [];
            case 'lambda': // (lambda args body)
                args = rest.car;
                body = rest.cdr;
                return findFree(body, setUnion(args.toArray(), vars));
            case 'if': // (if test thenc elsec)
                test = rest.car;
                thenc = rest.cdr.car;
                elsec = rest.cdr.cdr.car;
                return setUnion(findFree(test, vars),
                                setUnion(findFree(thenc, vars),
                                         findFree(elsec, vars)));
            case 'set!': // (set! name exp)
                name = rest.car;
                exp = rest.cdr.car;
                if (vars.indexOf(name) >= 0) {
                    return findFree(exp, vars);
                } else {
                    return setUnion([name], findFree(exp, vars));
                }
                break;
            case 'call/cc': // (call/cc exp)
                exp = rest;
                return findFree(exp, vars);
            default:
                set = [];
                while (expr !== Nil) {
                    set = setUnion(findFree(expr.car, vars), set);
                    expr = expr.cdr;
                }
                return set;
        }
    } else { // constant
        return [];
    }
}

/**
 * Find the assigned variables in a lambda expression.
 * This routine will look for assignments to any of the set of
 * variables `vars` and return the set of variables in `vars` that
 * are assigned.
 *
 * @param expr {Pair} An expression in which assigned variables are being searched.
 * @param vars {Array} An array of variables to search.
 * @return sets An array of the assigned variables.
 */
function findSets(expr, vars) {
    var rest, args, body, test, thenc, elsec, name, exp, set, pair;

    if (expr.type === 'symbol') {
        return [];
    } else if (expr.type === 'pair') {
        rest = expr.cdr;
        switch (expr.car.name) {
            case 'quote': // (quote obj)
                return [];
            case 'lambda': // (lambda args body)
                args = rest.car;
                body = rest.cdr;
                return findSets(body, setMinus(vars, args.toArray()));
            case 'if': // (if test thenc elsec)
                test = rest.car;
                thenc = rest.cdr.car;
                elsec = rest.cdr.cdr.car;
                return setUnion(findSets(test, vars),
                                setUnion(findSets(thenc, vars),
                                         findSets(elsec, vars)));
            case 'set!': // (set! name exp)
                name = rest.car;
                exp = rest.cdr.car;
                if (vars.indexOf(name) >= 0) {
                    return setUnion([name], findSets(exp, vars));
                } else {
                    return findSets(exp, name);
                }
                break;
            case 'call/cc': // (call/cc exp)
                exp = rest;
                return findSets(exp, vars);
            default:  // apply
                set = [];
                pair = expr;
                while (pair !== Nil) {
                    set = setUnion(findSets(pair.car, vars), set);
                    pair = pair.cdr;
                }
                return set;
        }
    } else { // constant
        return [];
    }
}

/**
 * Once the compiler determines what subset of the arguments to a lambda
 * expression are assigned, it must generate code to create boxes for
 * these arguments. The following function generates this code from a list
 * of assigned variables (sets) and a list of arguments (vars).
 *
 * @param sets {Array} An array of the assigned variables.
 * @param vars {Pair} A List of variables.
 * @param next {Array} Next instruction.
 * @return next The new next instruction.
 */
function makeBoxes(sets, vars, next) {
    var indices = [], n = 0, i;

    while (vars !== Nil) {
        if (sets.indexOf(vars.car) >= 0) {
            indices.push(n);
        }
        n += 1;
        vars = vars.cdr;
    }
    for (i = indices.length - 1; i >= 0; --i) {
        next = ['box', indices[i], next];
    }
    return next;
}

exports.compile = compile;
