var objects = require('./objects'),
    Nil     = objects.Nil;


/**
 * Compile the S-Expression into opcode.
 * An opcode is an array with the first item being the instruction name and
 * the rest being the parameters.
 * The compilation transforms the expression into Continuation-Passing Style.
 * So each opcode contains a `next` field, which is also an opcode.
 *
 * @param {Pair} expr S-Expression
 * @param {Array} env A compile-time environment is an array of two elements,
 *     with the first element being an array of local variables and the 
 *     second element being an array of free variables.
 * @param {Array} assigned The assigned variables in an expression.
 * @param {Object} next Next opcode.
 * @returns {Object} Next opcode
 */
function compile(expr, env, assigned, next) {
    var isAssigned, first, rest, obj, vars, body, free, sets, varsArray,
        test, thenc, elsec, name, exp, conti, args, func, i, variadic;

    if (expr.type === 'symbol') {
        isAssigned = (assigned.indexOf(expr) >= 0);
        return compileRefer(expr, env, isAssigned ?
                                           { type: 'indirect', next: next } :
                                           next);
    } else if (expr.type === 'pair') {
        first = expr.car;
        rest = expr.cdr;
        switch (first.name) {
            case 'quote': // (quote obj)
                return {
                    type: 'constant',
                    object: rest.car,
                    next: next
                };
            case 'begin': // (begin body)
                body = rest.toArray();
                for (i = body.length - 1; i >= 0; --i) {
                    next = compile(body[i], env, assigned, next);
                }
                return next;
            case 'lambda': // (lambda vars body)
                vars = rest.car;
                body = rest.cdr.car;
                varsArray = vars.type === 'symbol' ? [vars] : vars.toArray();
                free = findFree(body, varsArray);
                sets = findSets(body, varsArray);
                variadic = (vars.type === 'symbol' || !vars.isProperList());
                return collectFree(
                    free, env,
                    {
                        type: 'close',
                        n: free.length,
                        numArgs: {
                          min: variadic ? varsArray.length - 1 : varsArray.length,
                          max: variadic ? Infinity : varsArray.length
                        },
                        body: makeBoxes(sets, varsArray,
                                        compile(body, [varsArray, free],
                                                setUnion(sets,
                                                         setIntersect(assigned, free)),
                                                { type: 'return', n: varsArray.length })),
                        next: next
                    }
                );
            case 'if': // (if test thenc elsec)
                test = rest.car;
                thenc = rest.cdr.car;
                elsec = rest.cdr.cdr.car;
                thenc = compile(thenc, env, assigned, next);
                elsec = compile(elsec, env, assigned, next);
                return compile(test, env, assigned, { type: 'test', then: thenc, else: elsec });
            case 'set!': // (set! name exp)
                name = rest.car;
                exp = rest.cdr.car;
                return compileLookup(
                    name, env,
                    function (n) {
                        return compile(exp, env, assigned,
                                       { type: 'assign-local', n: n, next: next });
                    },
                    function (n) {
                        return compile(exp, env, assigned,
                                       { type: 'assign-free', n: n, next: next });
                    },
                    function (sym) {
                        return compile(exp, env, assigned,
                                       { type: 'assign-global', sym: sym, next: next });
                    }
                );
            case 'call/cc': // (call/cc exp)
                exp = rest.car;
                conti = {
                    type: 'conti',
                    next: {
                        type: 'argument',
                        next: compile(exp, env, assigned,
                                      isTail(next) ?
                                        { type: 'shift', n: 1, m: next.n, next: { type: 'apply', n: 1 } } :
                                        { type: 'apply', n: 1 })
                    }
                };
                return isTail(next) ? conti : { type: 'frame', ret: next, next: conti };
            default: // (func args)
                args = rest;
                func = compile(
                    first, env, assigned,
                    isTail(next) ?
                        { type: 'shift', n: args.getLength(), m: next.n, next: { type: 'apply', n: args.getLength() } }:
                        { type: 'apply', n: args.getLength() }
                );
                for (; args !== Nil; args = args.cdr) {
                    func = compile(args.car, env, assigned, { type: 'argument', next: func });
                }
                return isTail(next) ? func : { type: 'frame', ret: next, next: func };
        }
    } else { // constant
        return {
            type: 'constant',
            object: expr,
            next: next
        };
    }
}


/**
 * Determine whether the next opcode is a tail call.
 *
 * @param {Object} Next
 * @return {Boolean}
 */
function isTail(next) {
    return next.type === 'return';
}

/**
 * Collect the free variables for inclusion in the closure.
 *
 * @param {Array} vars
 * @param {Array} env
 * @param {Object} next
 * @return {Object} Compiled opcode
 */
function collectFree(vars, env, next) {
    var i, len;
    for (i = 0, len = vars.length; i < len; ++i) {
        next = compileRefer(vars[i], env, { type: 'argument', next: next });
    }
    return next;
}

/**
 * The help function `compileRefer` is used by the compiler for variable
 * references and by `collectFree` to collect free variable values.
 *
 * @param {Object} expr
 * @param {Array} env
 * @param {Object} next
 * @return {Object} Compiled opcode
 */
function compileRefer(expr, env, next) {
    var returnLocal = function (n) {
            return {
                type: 'refer-local',
                n: n,
                next: next
            };
        },
        returnFree = function (n) {
            return {
                type: 'refer-free',
                n: n,
                next: next
            };
        },
        returnGlobal = function (sym) {
            return {
                type: 'refer-global',
                symbol: sym,
                next: next
            };
        };
    return compileLookup(expr, env, returnLocal, returnFree, returnGlobal);
}

/**
 * The function `compileLookup` checks whether a variable is in the list
 * of local variables or is in the list of free variables, and returns the
 * correponding opcode.
 *
 * @param {Object} expr
 * @param {Array} env
 * @param {Function} returnLocal
 * @param {Function} returnFree
 * @param {Function} returnGlobal
 * @return {Object} compiled opcode
 */
function compileLookup(expr, env, returnLocal, returnFree, returnGlobal) {
    var locals = env[0],
        free = env[1],
        n;

    n = locals.indexOf(expr);
    if (n >= 0) {
        return returnLocal(n);
    }

    n = free.indexOf(expr);
    if (n >= 0) {
        return returnFree(n);
    }

    return returnGlobal(expr);
}

/**
 * Return the union of two sets.
 * Each set is represented by an array.
 *
 * @param {Array} sa
 * @param {Array} sb
 * @return {Array} union
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
 *
 * @param {Array} sa
 * @param {Array} sb
 * @return {Array} minus
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
 *
 * @param {Array} sa
 * @param {Array} sb
 * @return {Array} intersect
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
 * @param {Pair} expr An expression in which free variables are being searched.
 * @param {Array} vars An array of variables to search.
 * @return {Array} An array of the free variables.
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
            case 'begin': // (begin body)
                return findFree(rest, vars);
            case 'lambda': // (lambda args body)
                args = rest.car;
                body = rest.cdr.car;
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
                exp = rest.car;
                return findFree(exp, vars);
            default:
                set = [];
                for (; expr !== Nil; expr = expr.cdr) {
                    set = setUnion(findFree(expr.car, vars), set);
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
 * @param {Pair} expr An expression in which assigned variables are being searched.
 * @param {Array} vars An array of variables to search.
 * @return {Array} An array of the assigned variables.
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
            case 'begin': // (begin body)
                return findSets(rest, vars);
            case 'lambda': // (lambda args body)
                args = rest.car;
                body = rest.cdr.car;
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
                exp = rest.car;
                return findSets(exp, vars);
            default:  // apply
                set = [];
                for (pair = expr; pair !== Nil; pair = pair.cdr) {
                    set = setUnion(findSets(pair.car, vars), set);
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
 * @param {Array} sets An array of the assigned variables.
 * @param {Array} vars An array of variables.
 * @param {Object} next Next opcode.
 * @return {Object} Compiled opcode
 */
function makeBoxes(sets, vars, next) {
    var indices = [], n, i, len;

    for (i = 0, n = 0, len = vars.length; i < len; ++i, ++n) {
        if (sets.indexOf(vars[i]) >= 0) {
            indices.push(n);
        }
    }
    for (i = indices.length - 1; i >= 0; --i) {
        next = {
            type: 'box',
            n: indices[i],
            next: next
        };
    }
    return next;
}


exports.compile = function (expr) {
  var env = [[], []];
  var assigned = [];
  var next = { type: 'halt' };
  return compile(expr, env, assigned, next);
};
