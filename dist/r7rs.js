(function(e){if("function"==typeof bootstrap)bootstrap("r7rs",e);else if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else if("undefined"!=typeof ses){if(!ses.ok())return;ses.makeR7rs=e}else"undefined"!=typeof window?window.r7rs=e():global.r7rs=e()})(function(){var define,ses,bootstrap,module,exports;
return (function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
exports.parse = require('./src/parser').parse,
exports.compile = require('./src/compiler').compile,
exports.execute = require('./src/vm').execute;

},{"./src/parser":2,"./src/compiler":3,"./src/vm":4}],3:[function(require,module,exports){
(function(){var objects = require('./objects'),
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
 * @param {Array} next Next opcode.
 * @returns {Array} Next opcode
 */
function compile(expr, env, assigned, next) {
    var isAssigned, first, rest, obj, vars, body, free, sets,
        test, thenc, elsec, name, exp, conti, args, func, i;

    if (expr.type === 'symbol') {
        isAssigned = (assigned.indexOf(expr) >= 0);
        return compileRefer(expr, env, isAssigned ? ['indirect', next] : next);
    } else if (expr.type === 'pair') {
        first = expr.car;
        rest = expr.cdr;
        switch (first.name) {
            case 'quote': // (quote obj)
                return ['constant', rest.car, next];
            case 'begin': // (begin body)
                body = rest.toArray();
                for (i = body.length - 1; i >= 0; --i) {
                    next = compile(body[i], env, assigned, next);
                }
                return next;
            case 'lambda': // (lambda vars body)
                vars = rest.car;
                body = rest.cdr.car;
                free = findFree(body, vars.toArray());
                sets = findSets(body, vars.toArray());
                return collectFree(
                    free, env,
                    ['close', free.length,
                     makeBoxes(sets, vars,
                               compile(body, [vars.toArray(), free],
                                       setUnion(sets,
                                                setIntersect(assigned, free)),
                                       ['return', vars.getLength()])),
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
                    },
                    function (sym) {
                        return compile(exp, env, assigned,
                                       ['assign-global', sym, next]);
                    }
                );
            case 'call/cc': // (call/cc exp)
                exp = rest.car;
                conti = ['conti',
                         ['argument',
                          compile(exp, env, assigned,
                                  isTail(next) ?
                                      ['shift', 1, next[1], ['apply']] :
                                      ['apply'])]];
                return isTail(next) ? conti : ['frame', next, conti];
            default: // (func args)
                args = rest;
                func = compile(
                    first, env, assigned,
                    isTail(next) ?
                        ['shift', args.getLength(), next[1], ['apply']] :
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
 * Determine whether the next opcode is a tail call.
 *
 * @param {Array} Next
 * @return {Boolean}
 */
function isTail(next) {
    return next[0] === 'return';
}

/**
 * Collect the free variables for inclusion in the closure.
 *
 * @param {Array} vars
 * @param {Array} env
 * @param {Array} next
 * @return {Array} Compiled opcode
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
 *
 * @param {Array} expr
 * @param {Array} env
 * @param {Array} next
 * @return {Array} Compiled opcode
 */
function compileRefer(expr, env, next) {
    var returnLocal = function (n) {
            return ['refer-local', n, next];
        },
        returnFree = function (n) {
            return ['refer-free', n, next];
        },
        returnGlobal = function (sym) {
            return ['refer-global', sym, next];
        };
    return compileLookup(expr, env, returnLocal, returnFree, returnGlobal);
}

/**
 * The function `compileLookup` checks whether a variable is in the list
 * of local variables or is in the list of free variables, and returns the
 * correponding opcode.
 *
 * @param {Array} expr
 * @param {Array} env
 * @param {Function} returnLocal
 * @param {Function} returnFree
 * @param {Function} returnGlobal
 * @return {Array} compiled opcode
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
 * @param {Array} sets An array of the assigned variables.
 * @param {Pair} vars A List of variables.
 * @param {Array} next Next opcode.
 * @return {Array} Compiled opcode
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


exports.compile = function (expr) {
  var env = [[], []];
  var assigned = [];
  var next = ['halt'];
  return compile(expr, env, assigned, next);
};

})()
},{"./objects":5}],4:[function(require,module,exports){
(function(){var objects      = require('./objects'),
    Bool         = objects.Bool,
    ByteVector   = objects.ByteVector,
    Char         = objects.Char,
    Complex      = objects.Complex,
    Nil          = objects.Nil,
    Pair         = objects.Pair,
    Real         = objects.Real,
    Str          = objects.Str,
    Symbol       = objects.Symbol,
    Vector       = objects.Vector,
    TopLevel     = require('./toplevel');

function execute(opcode) {
    var acc     = null,             // accumulator
        expr    = opcode,           // next expression to execute
        fp      = 0,                // frame pointer
        closure = [],               // closure
        stack   = new Array(1000),  // call stack
        sp      = 0;                // stack pointer

    function makeClosure(body, n, sp) {
        var i, closure = new Array(n + 1);
        closure[0] = body;
        for (i = 0; i < n; ++i) {
            closure[i + 1] = stack[sp - i - 1];
        }
        return closure;
    }

    function makeContinuation(sp) {
        return makeClosure(
            ['refer-local', 0, ['nuate', saveStack(sp), ['return', 0]]],
            sp,
            sp
        );
    }

    function saveStack(sp) {
        return stack.slice(0, sp);
    }

    function restoreStack(savedStack) {
        var i, len;
        for (i = 0, len = savedStack.length; i < len; ++i) {
            stack[i] = savedStack[i];
        }
        return len;
    }

    function shiftArgs(n, m, sp) {
        var i;
        for (i = n - 1; i >= 0; --i) {
            stack[sp - i - m - 1] = stack[sp - i - 1];
        }
        return sp - m;
    }

    while (true) {
        //console.log(JSON.stringify(expr, null, 4));
        //console.log('acc:', acc);
        //console.log('stack:', stack.slice(0, sp));
        //console.log('clos:', JSON.stringify(closure, null, 4));
        //console.log('---------------------------------------');
        switch (expr[0]) { // instruction
            case 'halt':
                return acc;
            case 'constant': // (obj next)
                acc = expr[1];
                expr = expr[2];
                break;
            case 'box': // (n next)
                stack[sp - expr[1] - 1] = [stack[sp - expr[1] - 1]];
                expr = expr[2];
                break;
            case 'indirect': // (next)
                acc = acc[0]; // unbox
                expr = expr[1];
                break;
            case 'refer-local': // (n next)
                acc = stack[fp - expr[1] - 1];
                expr = expr[2];
                break;
            case 'refer-free': // (n next)
                acc = closure[expr[1] + 1];
                expr = expr[2];
                break;
            case 'refer-global': // (sym next)
                acc = TopLevel.get(expr[1]);
                expr = expr[2];
                break;
            case 'assign-local': // (n next)
                stack[fp - expr[1] - 1][0] = acc;
                expr = expr[2];
                break;
            case 'assign-free': // (n next)
                closure[expr[1] + 1][0] = acc;
                expr = expr[2];
                break;
            case 'assign-global': // (sym next)
                TopLevel.reset(expr[1], acc);
                expr = expr[2];
                break;
            case 'test': // (then else)
                expr = (acc === Bool.False ? expr[2] : expr[1]);
                break;
            case 'close': // (n body next)
                acc = makeClosure(expr[2], expr[1], sp);
                sp -= expr[1];
                expr = expr[3];
                break;
            case 'conti': // (next)
                acc = makeContinuation(sp);
                expr = expr[1];
                break;
            case 'nuate': // (stack next)
                sp = restoreStack(expr[1]);
                expr = expr[2];
                break;
            case 'frame': // (ret next)
                stack[sp++] = closure;
                stack[sp++] = fp;
                stack[sp++] = expr[1];
                expr = expr[2];
                break;
            case 'argument': // (next)
                stack[sp++] = acc;
                expr = expr[1];
                break;
            case 'shift': // (n m next)
                sp = shiftArgs(expr[1], expr[2], sp);
                expr = expr[3];
                break;
            case 'apply': // ()
                (function () {
                    var args = [], i;
                    if ((typeof acc) === 'function') {
                        for (i = 0; i < acc.numArgs; ++i) {
                            args.push(stack[sp - i - 1]);
                        }
                        sp -= acc.numArgs;
                        expr    = stack[sp - 1];
                        fp      = stack[sp - 2];
                        closure = stack[sp - 3];
                        sp -= 3;
                        acc = acc(args);
                    } else {
                        expr = acc[0];
                        fp = sp;
                        closure = acc;
                    }
                })();
                break;
            case 'return': // (n)
                sp -= expr[1];
                expr    = stack[sp - 1];
                fp      = stack[sp - 2];
                closure = stack[sp - 3];
                sp -= 3;
                break;
            default: // this should be an exception
                return acc;
        }
    }
}

exports.execute = execute;

})()
},{"./toplevel":6,"./objects":5}],2:[function(require,module,exports){
module.exports = (function(){
  /*
   * Generated by PEG.js 0.7.0.
   *
   * http://pegjs.majda.cz/
   */
  
  function quote(s) {
    /*
     * ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a
     * string literal except for the closing quote character, backslash,
     * carriage return, line separator, paragraph separator, and line feed.
     * Any character may appear in the form of an escape sequence.
     *
     * For portability, we also escape escape all control and non-ASCII
     * characters. Note that "\0" and "\v" escape sequences are not used
     * because JSHint does not like the first and IE the second.
     */
     return '"' + s
      .replace(/\\/g, '\\\\')  // backslash
      .replace(/"/g, '\\"')    // closing quote character
      .replace(/\x08/g, '\\b') // backspace
      .replace(/\t/g, '\\t')   // horizontal tab
      .replace(/\n/g, '\\n')   // line feed
      .replace(/\f/g, '\\f')   // form feed
      .replace(/\r/g, '\\r')   // carriage return
      .replace(/[\x00-\x07\x0B\x0E-\x1F\x80-\uFFFF]/g, escape)
      + '"';
  }
  
  var result = {
    /*
     * Parses the input with a generated parser. If the parsing is successfull,
     * returns a value explicitly or implicitly specified by the grammar from
     * which the parser was generated (see |PEG.buildParser|). If the parsing is
     * unsuccessful, throws |PEG.parser.SyntaxError| describing the error.
     */
    parse: function(input, startRule) {
      var parseFunctions = {
        "start": parse_start,
        "datum": parse_datum,
        "simpleDatum": parse_simpleDatum,
        "symbol": parse_symbol,
        "compoundDatum": parse_compoundDatum,
        "list": parse_list,
        "abbreviation": parse_abbreviation,
        "abbrevPrefix": parse_abbrevPrefix,
        "vector": parse_vector,
        "label": parse_label,
        "delimiter": parse_delimiter,
        "EOF": parse_EOF,
        "_": parse__,
        "intralineWhitespace": parse_intralineWhitespace,
        "whitespace": parse_whitespace,
        "linebreak": parse_linebreak,
        "comment": parse_comment,
        "nestedComment": parse_nestedComment,
        "commentText": parse_commentText,
        "atmosphere": parse_atmosphere,
        "intertokenSpace": parse_intertokenSpace,
        "identifier": parse_identifier,
        "initial": parse_initial,
        "letter": parse_letter,
        "specialInitial": parse_specialInitial,
        "subsequent": parse_subsequent,
        "digit": parse_digit,
        "hexDigit": parse_hexDigit,
        "explicitSign": parse_explicitSign,
        "specialSubsequent": parse_specialSubsequent,
        "inlineHexEscape": parse_inlineHexEscape,
        "hexScalarValue": parse_hexScalarValue,
        "peculiarIdentifier": parse_peculiarIdentifier,
        "nonDigit": parse_nonDigit,
        "dotSubsequent": parse_dotSubsequent,
        "signSubsequent": parse_signSubsequent,
        "symbolElement": parse_symbolElement,
        "boolean": parse_boolean,
        "character": parse_character,
        "characterName": parse_characterName,
        "string": parse_string,
        "stringElement": parse_stringElement,
        "bytevector": parse_bytevector,
        "byte": parse_byte,
        "num255": parse_num255,
        "number": parse_number,
        "num2": parse_num2,
        "complex2": parse_complex2,
        "real2": parse_real2,
        "ureal2": parse_ureal2,
        "uinteger2": parse_uinteger2,
        "prefix2": parse_prefix2,
        "num8": parse_num8,
        "complex8": parse_complex8,
        "real8": parse_real8,
        "ureal8": parse_ureal8,
        "uinteger8": parse_uinteger8,
        "prefix8": parse_prefix8,
        "num10": parse_num10,
        "complex10": parse_complex10,
        "real10": parse_real10,
        "ureal10": parse_ureal10,
        "decimal10": parse_decimal10,
        "suffix": parse_suffix,
        "exponentMarker": parse_exponentMarker,
        "uinteger10": parse_uinteger10,
        "prefix10": parse_prefix10,
        "num16": parse_num16,
        "complex16": parse_complex16,
        "real16": parse_real16,
        "ureal16": parse_ureal16,
        "uinteger16": parse_uinteger16,
        "prefix16": parse_prefix16,
        "infinity": parse_infinity,
        "sign": parse_sign,
        "exactness": parse_exactness,
        "radix2": parse_radix2,
        "radix8": parse_radix8,
        "radix10": parse_radix10,
        "radix16": parse_radix16,
        "digit2": parse_digit2,
        "digit8": parse_digit8,
        "digit16": parse_digit16,
        "empty": parse_empty
      };
      
      if (startRule !== undefined) {
        if (parseFunctions[startRule] === undefined) {
          throw new Error("Invalid rule name: " + quote(startRule) + ".");
        }
      } else {
        startRule = "start";
      }
      
      var pos = 0;
      var reportFailures = 0;
      var rightmostFailuresPos = 0;
      var rightmostFailuresExpected = [];
      
      function padLeft(input, padding, length) {
        var result = input;
        
        var padLength = length - input.length;
        for (var i = 0; i < padLength; i++) {
          result = padding + result;
        }
        
        return result;
      }
      
      function escape(ch) {
        var charCode = ch.charCodeAt(0);
        var escapeChar;
        var length;
        
        if (charCode <= 0xFF) {
          escapeChar = 'x';
          length = 2;
        } else {
          escapeChar = 'u';
          length = 4;
        }
        
        return '\\' + escapeChar + padLeft(charCode.toString(16).toUpperCase(), '0', length);
      }
      
      function matchFailed(failure) {
        if (pos < rightmostFailuresPos) {
          return;
        }
        
        if (pos > rightmostFailuresPos) {
          rightmostFailuresPos = pos;
          rightmostFailuresExpected = [];
        }
        
        rightmostFailuresExpected.push(failure);
      }
      
      function parse_start() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_intertokenSpace();
        if (result0 !== null) {
          result1 = [];
          result2 = parse_datum();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse_datum();
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, ds) { return ds; })(pos0, result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_datum() {
        var result0, result1, result2;
        var pos0, pos1, pos2;
        
        reportFailures++;
        pos0 = pos;
        pos1 = pos;
        result0 = parse_intertokenSpace();
        if (result0 !== null) {
          pos2 = pos;
          result1 = parse_simpleDatum();
          if (result1 !== null) {
            result2 = parse__();
            if (result2 !== null) {
              result1 = [result1, result2];
            } else {
              result1 = null;
              pos = pos2;
            }
          } else {
            result1 = null;
            pos = pos2;
          }
          if (result1 !== null) {
            result2 = parse_intertokenSpace();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, d) { return d; })(pos0, result0[1][0]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          result0 = parse_compoundDatum();
          if (result0 === null) {
            pos0 = pos;
            pos1 = pos;
            result0 = parse_label();
            if (result0 !== null) {
              if (input.charCodeAt(pos) === 61) {
                result1 = "=";
                pos++;
              } else {
                result1 = null;
                if (reportFailures === 0) {
                  matchFailed("\"=\"");
                }
              }
              if (result1 !== null) {
                result2 = parse_datum();
                if (result2 !== null) {
                  result0 = [result0, result1, result2];
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
            if (result0 !== null) {
              result0 = (function(offset, d) { return d; })(pos0, result0);
            }
            if (result0 === null) {
              pos = pos0;
            }
            if (result0 === null) {
              pos0 = pos;
              pos1 = pos;
              result0 = parse_label();
              if (result0 !== null) {
                if (input.charCodeAt(pos) === 35) {
                  result1 = "#";
                  pos++;
                } else {
                  result1 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"#\"");
                  }
                }
                if (result1 !== null) {
                  result0 = [result0, result1];
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
              if (result0 !== null) {
                result0 = (function(offset, d) { return d; })(pos0, result0);
              }
              if (result0 === null) {
                pos = pos0;
              }
            }
          }
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("datum");
        }
        return result0;
      }
      
      function parse_simpleDatum() {
        var result0;
        
        result0 = parse_boolean();
        if (result0 === null) {
          result0 = parse_number();
          if (result0 === null) {
            result0 = parse_character();
            if (result0 === null) {
              result0 = parse_string();
              if (result0 === null) {
                result0 = parse_symbol();
                if (result0 === null) {
                  result0 = parse_bytevector();
                }
              }
            }
          }
        }
        return result0;
      }
      
      function parse_symbol() {
        var result0;
        var pos0;
        
        pos0 = pos;
        result0 = parse_identifier();
        if (result0 !== null) {
          result0 = (function(offset, id) { return new Symbol(id); })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_compoundDatum() {
        var result0;
        
        result0 = parse_list();
        if (result0 === null) {
          result0 = parse_vector();
        }
        return result0;
      }
      
      function parse_list() {
        var result0, result1, result2, result3, result4, result5, result6, result7, result8, result9, result10;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_intertokenSpace();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 40) {
            result1 = "(";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"(\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_intertokenSpace();
            if (result2 !== null) {
              result3 = [];
              result4 = parse_datum();
              while (result4 !== null) {
                result3.push(result4);
                result4 = parse_datum();
              }
              if (result3 !== null) {
                result4 = parse_intertokenSpace();
                if (result4 !== null) {
                  if (input.charCodeAt(pos) === 41) {
                    result5 = ")";
                    pos++;
                  } else {
                    result5 = null;
                    if (reportFailures === 0) {
                      matchFailed("\")\"");
                    }
                  }
                  if (result5 !== null) {
                    result6 = parse_intertokenSpace();
                    if (result6 !== null) {
                      result0 = [result0, result1, result2, result3, result4, result5, result6];
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, ds) {
                return Pair.makeList(ds);
            })(pos0, result0[3]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          pos1 = pos;
          result0 = parse_intertokenSpace();
          if (result0 !== null) {
            if (input.charCodeAt(pos) === 40) {
              result1 = "(";
              pos++;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("\"(\"");
              }
            }
            if (result1 !== null) {
              result2 = parse_intertokenSpace();
              if (result2 !== null) {
                result4 = parse_datum();
                if (result4 !== null) {
                  result3 = [];
                  while (result4 !== null) {
                    result3.push(result4);
                    result4 = parse_datum();
                  }
                } else {
                  result3 = null;
                }
                if (result3 !== null) {
                  result4 = parse_intertokenSpace();
                  if (result4 !== null) {
                    pos2 = pos;
                    if (input.charCodeAt(pos) === 46) {
                      result5 = ".";
                      pos++;
                    } else {
                      result5 = null;
                      if (reportFailures === 0) {
                        matchFailed("\".\"");
                      }
                    }
                    if (result5 !== null) {
                      result6 = parse__();
                      if (result6 !== null) {
                        result5 = [result5, result6];
                      } else {
                        result5 = null;
                        pos = pos2;
                      }
                    } else {
                      result5 = null;
                      pos = pos2;
                    }
                    if (result5 !== null) {
                      result6 = parse_intertokenSpace();
                      if (result6 !== null) {
                        result7 = parse_datum();
                        if (result7 !== null) {
                          result8 = parse_intertokenSpace();
                          if (result8 !== null) {
                            if (input.charCodeAt(pos) === 41) {
                              result9 = ")";
                              pos++;
                            } else {
                              result9 = null;
                              if (reportFailures === 0) {
                                matchFailed("\")\"");
                              }
                            }
                            if (result9 !== null) {
                              result10 = parse_intertokenSpace();
                              if (result10 !== null) {
                                result0 = [result0, result1, result2, result3, result4, result5, result6, result7, result8, result9, result10];
                              } else {
                                result0 = null;
                                pos = pos1;
                              }
                            } else {
                              result0 = null;
                              pos = pos1;
                            }
                          } else {
                            result0 = null;
                            pos = pos1;
                          }
                        } else {
                          result0 = null;
                          pos = pos1;
                        }
                      } else {
                        result0 = null;
                        pos = pos1;
                      }
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
          if (result0 !== null) {
            result0 = (function(offset, ds, d) {
                  var i, len = ds.length, pair = new Pair(ds[len - 1], d);
                  for (i = len - 2; i >= 0; --i) {
                      pair = new Pair(ds[i], pair);
                  }
                  return pair;
                })(pos0, result0[3], result0[7]);
          }
          if (result0 === null) {
            pos = pos0;
          }
          if (result0 === null) {
            pos0 = pos;
            pos1 = pos;
            result0 = parse_intertokenSpace();
            if (result0 !== null) {
              result1 = parse_abbreviation();
              if (result1 !== null) {
                result2 = parse_intertokenSpace();
                if (result2 !== null) {
                  result0 = [result0, result1, result2];
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
            if (result0 !== null) {
              result0 = (function(offset, a) { return a; })(pos0, result0[1]);
            }
            if (result0 === null) {
              pos = pos0;
            }
          }
        }
        return result0;
      }
      
      function parse_abbreviation() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_abbrevPrefix();
        if (result0 !== null) {
          result1 = parse_datum();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, a, d) {
                var symbol;
                switch (a) {
                    case ',@': symbol = new Symbol('unquote-splicing'); break;
                    case ',':  symbol = new Symbol('unquote'); break;
                    case '\'': symbol = new Symbol('quote'); break;
                    case '`':  symbol = new Symbol('quasiquote'); break; 
                }
                return new Pair(symbol, new Pair(d, Nil));
              })(pos0, result0[0], result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_abbrevPrefix() {
        var result0;
        
        if (input.substr(pos, 2) === ",@") {
          result0 = ",@";
          pos += 2;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\",@\"");
          }
        }
        if (result0 === null) {
          if (/^['`,]/.test(input.charAt(pos))) {
            result0 = input.charAt(pos);
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("['`,]");
            }
          }
        }
        return result0;
      }
      
      function parse_vector() {
        var result0, result1, result2, result3, result4, result5, result6;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_intertokenSpace();
        if (result0 !== null) {
          if (input.substr(pos, 2) === "#(") {
            result1 = "#(";
            pos += 2;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"#(\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_intertokenSpace();
            if (result2 !== null) {
              result3 = [];
              result4 = parse_datum();
              while (result4 !== null) {
                result3.push(result4);
                result4 = parse_datum();
              }
              if (result3 !== null) {
                result4 = parse_intertokenSpace();
                if (result4 !== null) {
                  if (input.charCodeAt(pos) === 41) {
                    result5 = ")";
                    pos++;
                  } else {
                    result5 = null;
                    if (reportFailures === 0) {
                      matchFailed("\")\"");
                    }
                  }
                  if (result5 !== null) {
                    result6 = parse_intertokenSpace();
                    if (result6 !== null) {
                      result0 = [result0, result1, result2, result3, result4, result5, result6];
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, ds) { return new Vector(ds); })(pos0, result0[3]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_label() {
        var result0, result1, result2;
        var pos0;
        
        pos0 = pos;
        if (input.charCodeAt(pos) === 35) {
          result0 = "#";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"#\"");
          }
        }
        if (result0 !== null) {
          result2 = parse_digit();
          if (result2 !== null) {
            result1 = [];
            while (result2 !== null) {
              result1.push(result2);
              result2 = parse_digit();
            }
          } else {
            result1 = null;
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_delimiter() {
        var result0;
        
        reportFailures++;
        result0 = parse_whitespace();
        if (result0 === null) {
          if (input.charCodeAt(pos) === 40) {
            result0 = "(";
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"(\"");
            }
          }
          if (result0 === null) {
            if (input.charCodeAt(pos) === 41) {
              result0 = ")";
              pos++;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\")\"");
              }
            }
            if (result0 === null) {
              if (input.charCodeAt(pos) === 34) {
                result0 = "\"";
                pos++;
              } else {
                result0 = null;
                if (reportFailures === 0) {
                  matchFailed("\"\\\"\"");
                }
              }
              if (result0 === null) {
                if (input.charCodeAt(pos) === 59) {
                  result0 = ";";
                  pos++;
                } else {
                  result0 = null;
                  if (reportFailures === 0) {
                    matchFailed("\";\"");
                  }
                }
                if (result0 === null) {
                  if (input.charCodeAt(pos) === 124) {
                    result0 = "|";
                    pos++;
                  } else {
                    result0 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"|\"");
                    }
                  }
                }
              }
            }
          }
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("delimiter");
        }
        return result0;
      }
      
      function parse_EOF() {
        var result0;
        var pos0;
        
        pos0 = pos;
        reportFailures++;
        if (input.length > pos) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("any character");
          }
        }
        reportFailures--;
        if (result0 === null) {
          result0 = "";
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse__() {
        var result0;
        var pos0;
        
        pos0 = pos;
        reportFailures++;
        result0 = parse_delimiter();
        if (result0 === null) {
          result0 = parse_EOF();
        }
        reportFailures--;
        if (result0 !== null) {
          result0 = "";
          pos = pos0;
        } else {
          result0 = null;
        }
        return result0;
      }
      
      function parse_intralineWhitespace() {
        var result0;
        
        if (/^[ \t]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[ \\t]");
          }
        }
        return result0;
      }
      
      function parse_whitespace() {
        var result0;
        
        result0 = parse_intralineWhitespace();
        if (result0 === null) {
          if (/^[\n\r]/.test(input.charAt(pos))) {
            result0 = input.charAt(pos);
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("[\\n\\r]");
            }
          }
        }
        return result0;
      }
      
      function parse_linebreak() {
        var result0, result1;
        var pos0;
        
        reportFailures++;
        pos0 = pos;
        if (input.charCodeAt(pos) === 13) {
          result0 = "\r";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"\\r\"");
          }
        }
        result0 = result0 !== null ? result0 : "";
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 10) {
            result1 = "\n";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"\\n\"");
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("linebreak");
        }
        return result0;
      }
      
      function parse_comment() {
        var result0, result1, result2, result3;
        var pos0, pos1, pos2;
        
        reportFailures++;
        pos0 = pos;
        if (input.charCodeAt(pos) === 59) {
          result0 = ";";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\";\"");
          }
        }
        if (result0 !== null) {
          result1 = [];
          pos1 = pos;
          pos2 = pos;
          reportFailures++;
          result2 = parse_linebreak();
          reportFailures--;
          if (result2 === null) {
            result2 = "";
          } else {
            result2 = null;
            pos = pos2;
          }
          if (result2 !== null) {
            if (input.length > pos) {
              result3 = input.charAt(pos);
              pos++;
            } else {
              result3 = null;
              if (reportFailures === 0) {
                matchFailed("any character");
              }
            }
            if (result3 !== null) {
              result2 = [result2, result3];
            } else {
              result2 = null;
              pos = pos1;
            }
          } else {
            result2 = null;
            pos = pos1;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos1 = pos;
            pos2 = pos;
            reportFailures++;
            result2 = parse_linebreak();
            reportFailures--;
            if (result2 === null) {
              result2 = "";
            } else {
              result2 = null;
              pos = pos2;
            }
            if (result2 !== null) {
              if (input.length > pos) {
                result3 = input.charAt(pos);
                pos++;
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("any character");
                }
              }
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = pos1;
              }
            } else {
              result2 = null;
              pos = pos1;
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        if (result0 === null) {
          result0 = parse_nestedComment();
          if (result0 === null) {
            pos0 = pos;
            if (input.substr(pos, 2) === "#;") {
              result0 = "#;";
              pos += 2;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"#;\"");
              }
            }
            if (result0 !== null) {
              result1 = [];
              result2 = parse_whitespace();
              while (result2 !== null) {
                result1.push(result2);
                result2 = parse_whitespace();
              }
              if (result1 !== null) {
                result2 = parse_datum();
                if (result2 !== null) {
                  result0 = [result0, result1, result2];
                } else {
                  result0 = null;
                  pos = pos0;
                }
              } else {
                result0 = null;
                pos = pos0;
              }
            } else {
              result0 = null;
              pos = pos0;
            }
          }
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("comment");
        }
        return result0;
      }
      
      function parse_nestedComment() {
        var result0, result1, result2;
        var pos0;
        
        pos0 = pos;
        if (input.substr(pos, 2) === "#|") {
          result0 = "#|";
          pos += 2;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"#|\"");
          }
        }
        if (result0 !== null) {
          result1 = [];
          result2 = parse_commentText();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse_commentText();
          }
          if (result1 !== null) {
            if (input.substr(pos, 2) === "|#") {
              result2 = "|#";
              pos += 2;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"|#\"");
              }
            }
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_commentText() {
        var result0, result1, result2;
        var pos0, pos1;
        
        result0 = parse_nestedComment();
        if (result0 === null) {
          pos0 = pos;
          pos1 = pos;
          reportFailures++;
          if (input.substr(pos, 2) === "#|") {
            result0 = "#|";
            pos += 2;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"#|\"");
            }
          }
          reportFailures--;
          if (result0 === null) {
            result0 = "";
          } else {
            result0 = null;
            pos = pos1;
          }
          if (result0 !== null) {
            pos1 = pos;
            reportFailures++;
            if (input.substr(pos, 2) === "|#") {
              result1 = "|#";
              pos += 2;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("\"|#\"");
              }
            }
            reportFailures--;
            if (result1 === null) {
              result1 = "";
            } else {
              result1 = null;
              pos = pos1;
            }
            if (result1 !== null) {
              if (input.length > pos) {
                result2 = input.charAt(pos);
                pos++;
              } else {
                result2 = null;
                if (reportFailures === 0) {
                  matchFailed("any character");
                }
              }
              if (result2 !== null) {
                result0 = [result0, result1, result2];
              } else {
                result0 = null;
                pos = pos0;
              }
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        }
        return result0;
      }
      
      function parse_atmosphere() {
        var result0;
        
        result0 = parse_whitespace();
        if (result0 === null) {
          result0 = parse_comment();
        }
        return result0;
      }
      
      function parse_intertokenSpace() {
        var result0, result1;
        
        result0 = [];
        result1 = parse_atmosphere();
        while (result1 !== null) {
          result0.push(result1);
          result1 = parse_atmosphere();
        }
        return result0;
      }
      
      function parse_identifier() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 124) {
          result0 = "|";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"|\"");
          }
        }
        if (result0 !== null) {
          result1 = [];
          result2 = parse_symbolElement();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse_symbolElement();
          }
          if (result1 !== null) {
            if (input.charCodeAt(pos) === 124) {
              result2 = "|";
              pos++;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"|\"");
              }
            }
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, s) { return s.join(''); })(pos0, result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          result0 = parse_peculiarIdentifier();
          if (result0 === null) {
            pos0 = pos;
            pos1 = pos;
            result0 = parse_initial();
            if (result0 !== null) {
              result1 = [];
              result2 = parse_subsequent();
              while (result2 !== null) {
                result1.push(result2);
                result2 = parse_subsequent();
              }
              if (result1 !== null) {
                result0 = [result0, result1];
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
            if (result0 !== null) {
              result0 = (function(offset, i, s) { return i + s.join(''); })(pos0, result0[0], result0[1]);
            }
            if (result0 === null) {
              pos = pos0;
            }
          }
        }
        return result0;
      }
      
      function parse_initial() {
        var result0;
        
        result0 = parse_letter();
        if (result0 === null) {
          result0 = parse_specialInitial();
          if (result0 === null) {
            result0 = parse_inlineHexEscape();
          }
        }
        return result0;
      }
      
      function parse_letter() {
        var result0;
        
        if (/^[a-z]/i.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[a-z]i");
          }
        }
        return result0;
      }
      
      function parse_specialInitial() {
        var result0;
        
        if (/^[!$%&*\/:<=>?^_~]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[!$%&*\\/:<=>?^_~]");
          }
        }
        return result0;
      }
      
      function parse_subsequent() {
        var result0;
        
        result0 = parse_initial();
        if (result0 === null) {
          result0 = parse_digit();
          if (result0 === null) {
            result0 = parse_specialSubsequent();
          }
        }
        return result0;
      }
      
      function parse_digit() {
        var result0;
        
        if (/^[0-9]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[0-9]");
          }
        }
        return result0;
      }
      
      function parse_hexDigit() {
        var result0;
        
        result0 = parse_digit();
        if (result0 === null) {
          if (/^[a-f]/i.test(input.charAt(pos))) {
            result0 = input.charAt(pos);
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("[a-f]i");
            }
          }
        }
        return result0;
      }
      
      function parse_explicitSign() {
        var result0;
        
        if (/^[+\-]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[+\\-]");
          }
        }
        return result0;
      }
      
      function parse_specialSubsequent() {
        var result0;
        
        result0 = parse_explicitSign();
        if (result0 === null) {
          if (/^[.@]/.test(input.charAt(pos))) {
            result0 = input.charAt(pos);
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("[.@]");
            }
          }
        }
        return result0;
      }
      
      function parse_inlineHexEscape() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.substr(pos, 2) === "\\x") {
          result0 = "\\x";
          pos += 2;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"\\\\x\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_hexScalarValue();
          if (result1 !== null) {
            if (input.charCodeAt(pos) === 59) {
              result2 = ";";
              pos++;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\";\"");
              }
            }
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, h) { return String.fromCharCode(h); })(pos0, result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_hexScalarValue() {
        var result0, result1;
        var pos0;
        
        pos0 = pos;
        result1 = parse_hexDigit();
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            result1 = parse_hexDigit();
          }
        } else {
          result0 = null;
        }
        if (result0 !== null) {
          result0 = (function(offset, h) { return parseInt(h.join(''), 16); })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_peculiarIdentifier() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_explicitSign();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 46) {
            result1 = ".";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\".\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_dotSubsequent();
            if (result2 !== null) {
              result3 = [];
              result4 = parse_subsequent();
              while (result4 !== null) {
                result3.push(result4);
                result4 = parse_subsequent();
              }
              if (result3 !== null) {
                result0 = [result0, result1, result2, result3];
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, e, d, s) {
                  return e + '.' + d + s.join('');
              })(pos0, result0[0], result0[2], result0[3]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          pos1 = pos;
          result0 = parse_explicitSign();
          if (result0 !== null) {
            result1 = parse_signSubsequent();
            if (result1 !== null) {
              result2 = [];
              result3 = parse_subsequent();
              while (result3 !== null) {
                result2.push(result3);
                result3 = parse_subsequent();
              }
              if (result2 !== null) {
                result0 = [result0, result1, result2];
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
          if (result0 !== null) {
            result0 = (function(offset, e, ss, s) {
                    return e + ss + s.join('');
                })(pos0, result0[0], result0[1], result0[2]);
          }
          if (result0 === null) {
            pos = pos0;
          }
          if (result0 === null) {
            result0 = parse_explicitSign();
            if (result0 === null) {
              pos0 = pos;
              pos1 = pos;
              if (input.charCodeAt(pos) === 46) {
                result0 = ".";
                pos++;
              } else {
                result0 = null;
                if (reportFailures === 0) {
                  matchFailed("\".\"");
                }
              }
              if (result0 !== null) {
                result1 = parse_nonDigit();
                if (result1 !== null) {
                  result2 = [];
                  result3 = parse_subsequent();
                  while (result3 !== null) {
                    result2.push(result3);
                    result3 = parse_subsequent();
                  }
                  if (result2 !== null) {
                    result0 = [result0, result1, result2];
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
              if (result0 !== null) {
                result0 = (function(offset, n, ss) {
                        return '.' + n + ss.join('');
                    })(pos0, result0[1], result0[2]);
              }
              if (result0 === null) {
                pos = pos0;
              }
            }
          }
        }
        return result0;
      }
      
      function parse_nonDigit() {
        var result0;
        
        result0 = parse_dotSubsequent();
        if (result0 === null) {
          result0 = parse_explicitSign();
        }
        return result0;
      }
      
      function parse_dotSubsequent() {
        var result0;
        
        if (input.charCodeAt(pos) === 46) {
          result0 = ".";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\".\"");
          }
        }
        if (result0 === null) {
          result0 = parse_signSubsequent();
        }
        return result0;
      }
      
      function parse_signSubsequent() {
        var result0;
        
        if (input.charCodeAt(pos) === 64) {
          result0 = "@";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"@\"");
          }
        }
        if (result0 === null) {
          result0 = parse_explicitSign();
          if (result0 === null) {
            result0 = parse_initial();
          }
        }
        return result0;
      }
      
      function parse_symbolElement() {
        var result0;
        
        result0 = parse_inlineHexEscape();
        if (result0 === null) {
          if (/^[^|\\]/.test(input.charAt(pos))) {
            result0 = input.charAt(pos);
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("[^|\\\\]");
            }
          }
        }
        return result0;
      }
      
      function parse_boolean() {
        var result0;
        var pos0;
        
        reportFailures++;
        pos0 = pos;
        if (input.substr(pos, 5) === "#true") {
          result0 = "#true";
          pos += 5;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"#true\"");
          }
        }
        if (result0 === null) {
          if (input.substr(pos, 2) === "#t") {
            result0 = "#t";
            pos += 2;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"#t\"");
            }
          }
        }
        if (result0 !== null) {
          result0 = (function(offset) { return new Bool(true);  })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          if (input.substr(pos, 6) === "#false") {
            result0 = "#false";
            pos += 6;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"#false\"");
            }
          }
          if (result0 === null) {
            if (input.substr(pos, 2) === "#f") {
              result0 = "#f";
              pos += 2;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"#f\"");
              }
            }
          }
          if (result0 !== null) {
            result0 = (function(offset) { return new Bool(false); })(pos0);
          }
          if (result0 === null) {
            pos = pos0;
          }
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("boolean");
        }
        return result0;
      }
      
      function parse_character() {
        var result0, result1;
        var pos0, pos1;
        
        reportFailures++;
        pos0 = pos;
        pos1 = pos;
        if (input.substr(pos, 3) === "#\\x") {
          result0 = "#\\x";
          pos += 3;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"#\\\\x\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_hexScalarValue();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, h) { return new Char(String.fromCharCode(h)); })(pos0, result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          pos1 = pos;
          if (input.substr(pos, 2) === "#\\") {
            result0 = "#\\";
            pos += 2;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"#\\\\\"");
            }
          }
          if (result0 !== null) {
            result1 = parse_characterName();
            if (result1 !== null) {
              result0 = [result0, result1];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
          if (result0 !== null) {
            result0 = (function(offset, c) { return new Char(c); })(pos0, result0[1]);
          }
          if (result0 === null) {
            pos = pos0;
          }
          if (result0 === null) {
            pos0 = pos;
            pos1 = pos;
            if (input.substr(pos, 2) === "#\\") {
              result0 = "#\\";
              pos += 2;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"#\\\\\"");
              }
            }
            if (result0 !== null) {
              if (input.length > pos) {
                result1 = input.charAt(pos);
                pos++;
              } else {
                result1 = null;
                if (reportFailures === 0) {
                  matchFailed("any character");
                }
              }
              if (result1 !== null) {
                result0 = [result0, result1];
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
            if (result0 !== null) {
              result0 = (function(offset, c) { return new Char(c); })(pos0, result0[1]);
            }
            if (result0 === null) {
              pos = pos0;
            }
          }
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("character");
        }
        return result0;
      }
      
      function parse_characterName() {
        var result0;
        var pos0;
        
        pos0 = pos;
        if (input.substr(pos, 5) === "alarm") {
          result0 = "alarm";
          pos += 5;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"alarm\"");
          }
        }
        if (result0 !== null) {
          result0 = (function(offset) { return '\u0007'; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          if (input.substr(pos, 9) === "backspace") {
            result0 = "backspace";
            pos += 9;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"backspace\"");
            }
          }
          if (result0 !== null) {
            result0 = (function(offset) { return '\u0008'; })(pos0);
          }
          if (result0 === null) {
            pos = pos0;
          }
          if (result0 === null) {
            pos0 = pos;
            if (input.substr(pos, 6) === "delete") {
              result0 = "delete";
              pos += 6;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"delete\"");
              }
            }
            if (result0 !== null) {
              result0 = (function(offset) { return '\u007f'; })(pos0);
            }
            if (result0 === null) {
              pos = pos0;
            }
            if (result0 === null) {
              pos0 = pos;
              if (input.substr(pos, 6) === "escape") {
                result0 = "escape";
                pos += 6;
              } else {
                result0 = null;
                if (reportFailures === 0) {
                  matchFailed("\"escape\"");
                }
              }
              if (result0 !== null) {
                result0 = (function(offset) { return '\u001b'; })(pos0);
              }
              if (result0 === null) {
                pos = pos0;
              }
              if (result0 === null) {
                pos0 = pos;
                if (input.substr(pos, 7) === "newline") {
                  result0 = "newline";
                  pos += 7;
                } else {
                  result0 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"newline\"");
                  }
                }
                if (result0 !== null) {
                  result0 = (function(offset) { return '\n';     })(pos0);
                }
                if (result0 === null) {
                  pos = pos0;
                }
                if (result0 === null) {
                  pos0 = pos;
                  if (input.substr(pos, 4) === "null") {
                    result0 = "null";
                    pos += 4;
                  } else {
                    result0 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"null\"");
                    }
                  }
                  if (result0 !== null) {
                    result0 = (function(offset) { return '\0';     })(pos0);
                  }
                  if (result0 === null) {
                    pos = pos0;
                  }
                  if (result0 === null) {
                    pos0 = pos;
                    if (input.substr(pos, 6) === "return") {
                      result0 = "return";
                      pos += 6;
                    } else {
                      result0 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"return\"");
                      }
                    }
                    if (result0 !== null) {
                      result0 = (function(offset) { return '\r';     })(pos0);
                    }
                    if (result0 === null) {
                      pos = pos0;
                    }
                    if (result0 === null) {
                      pos0 = pos;
                      if (input.substr(pos, 5) === "space") {
                        result0 = "space";
                        pos += 5;
                      } else {
                        result0 = null;
                        if (reportFailures === 0) {
                          matchFailed("\"space\"");
                        }
                      }
                      if (result0 !== null) {
                        result0 = (function(offset) { return ' ';      })(pos0);
                      }
                      if (result0 === null) {
                        pos = pos0;
                      }
                      if (result0 === null) {
                        pos0 = pos;
                        if (input.substr(pos, 3) === "tab") {
                          result0 = "tab";
                          pos += 3;
                        } else {
                          result0 = null;
                          if (reportFailures === 0) {
                            matchFailed("\"tab\"");
                          }
                        }
                        if (result0 !== null) {
                          result0 = (function(offset) { return '\t';     })(pos0);
                        }
                        if (result0 === null) {
                          pos = pos0;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        return result0;
      }
      
      function parse_string() {
        var result0, result1, result2;
        var pos0, pos1;
        
        reportFailures++;
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 34) {
          result0 = "\"";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"\\\"\"");
          }
        }
        if (result0 !== null) {
          result1 = [];
          result2 = parse_stringElement();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse_stringElement();
          }
          if (result1 !== null) {
            if (input.charCodeAt(pos) === 34) {
              result2 = "\"";
              pos++;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"\\\"\"");
              }
            }
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, ss) { return new Str(ss.join('')); })(pos0, result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("string");
        }
        return result0;
      }
      
      function parse_stringElement() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1;
        
        pos0 = pos;
        if (input.substr(pos, 2) === "\\a") {
          result0 = "\\a";
          pos += 2;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"\\\\a\"");
          }
        }
        if (result0 !== null) {
          result0 = (function(offset) { return '\u0007'; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          if (input.substr(pos, 2) === "\\b") {
            result0 = "\\b";
            pos += 2;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"\\\\b\"");
            }
          }
          if (result0 !== null) {
            result0 = (function(offset) { return '\u0008'; })(pos0);
          }
          if (result0 === null) {
            pos = pos0;
          }
          if (result0 === null) {
            pos0 = pos;
            if (input.substr(pos, 2) === "\\t") {
              result0 = "\\t";
              pos += 2;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"\\\\t\"");
              }
            }
            if (result0 !== null) {
              result0 = (function(offset) { return '\t';     })(pos0);
            }
            if (result0 === null) {
              pos = pos0;
            }
            if (result0 === null) {
              pos0 = pos;
              if (input.substr(pos, 2) === "\\n") {
                result0 = "\\n";
                pos += 2;
              } else {
                result0 = null;
                if (reportFailures === 0) {
                  matchFailed("\"\\\\n\"");
                }
              }
              if (result0 !== null) {
                result0 = (function(offset) { return '\n';     })(pos0);
              }
              if (result0 === null) {
                pos = pos0;
              }
              if (result0 === null) {
                pos0 = pos;
                if (input.substr(pos, 2) === "\\r") {
                  result0 = "\\r";
                  pos += 2;
                } else {
                  result0 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"\\\\r\"");
                  }
                }
                if (result0 !== null) {
                  result0 = (function(offset) { return '\r';     })(pos0);
                }
                if (result0 === null) {
                  pos = pos0;
                }
                if (result0 === null) {
                  pos0 = pos;
                  if (input.substr(pos, 2) === "\\\"") {
                    result0 = "\\\"";
                    pos += 2;
                  } else {
                    result0 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"\\\\\\\"\"");
                    }
                  }
                  if (result0 !== null) {
                    result0 = (function(offset) { return '"';      })(pos0);
                  }
                  if (result0 === null) {
                    pos = pos0;
                  }
                  if (result0 === null) {
                    pos0 = pos;
                    if (input.substr(pos, 2) === "\\\\") {
                      result0 = "\\\\";
                      pos += 2;
                    } else {
                      result0 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"\\\\\\\\\"");
                      }
                    }
                    if (result0 !== null) {
                      result0 = (function(offset) { return '\\';     })(pos0);
                    }
                    if (result0 === null) {
                      pos = pos0;
                    }
                    if (result0 === null) {
                      pos0 = pos;
                      pos1 = pos;
                      if (input.charCodeAt(pos) === 92) {
                        result0 = "\\";
                        pos++;
                      } else {
                        result0 = null;
                        if (reportFailures === 0) {
                          matchFailed("\"\\\\\"");
                        }
                      }
                      if (result0 !== null) {
                        result1 = [];
                        result2 = parse_intralineWhitespace();
                        while (result2 !== null) {
                          result1.push(result2);
                          result2 = parse_intralineWhitespace();
                        }
                        if (result1 !== null) {
                          result2 = parse_linebreak();
                          if (result2 !== null) {
                            result3 = [];
                            result4 = parse_intralineWhitespace();
                            while (result4 !== null) {
                              result3.push(result4);
                              result4 = parse_intralineWhitespace();
                            }
                            if (result3 !== null) {
                              result0 = [result0, result1, result2, result3];
                            } else {
                              result0 = null;
                              pos = pos1;
                            }
                          } else {
                            result0 = null;
                            pos = pos1;
                          }
                        } else {
                          result0 = null;
                          pos = pos1;
                        }
                      } else {
                        result0 = null;
                        pos = pos1;
                      }
                      if (result0 !== null) {
                        result0 = (function(offset) { return ''; })(pos0);
                      }
                      if (result0 === null) {
                        pos = pos0;
                      }
                      if (result0 === null) {
                        result0 = parse_inlineHexEscape();
                        if (result0 === null) {
                          if (/^[^"\\]/.test(input.charAt(pos))) {
                            result0 = input.charAt(pos);
                            pos++;
                          } else {
                            result0 = null;
                            if (reportFailures === 0) {
                              matchFailed("[^\"\\\\]");
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        return result0;
      }
      
      function parse_bytevector() {
        var result0, result1, result2, result3, result4, result5, result6;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_intertokenSpace();
        if (result0 !== null) {
          if (input.substr(pos, 4) === "#u8(") {
            result1 = "#u8(";
            pos += 4;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"#u8(\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_intertokenSpace();
            if (result2 !== null) {
              result3 = [];
              result4 = parse_byte();
              while (result4 !== null) {
                result3.push(result4);
                result4 = parse_byte();
              }
              if (result3 !== null) {
                result4 = parse_intertokenSpace();
                if (result4 !== null) {
                  if (input.charCodeAt(pos) === 41) {
                    result5 = ")";
                    pos++;
                  } else {
                    result5 = null;
                    if (reportFailures === 0) {
                      matchFailed("\")\"");
                    }
                  }
                  if (result5 !== null) {
                    result6 = parse_intertokenSpace();
                    if (result6 !== null) {
                      result0 = [result0, result1, result2, result3, result4, result5, result6];
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, bs) { return new ByteVector(bs); })(pos0, result0[3]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_byte() {
        var result0, result1, result2, result3;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_intertokenSpace();
        if (result0 !== null) {
          result1 = parse_num255();
          if (result1 !== null) {
            result2 = parse__();
            if (result2 !== null) {
              result3 = parse_intertokenSpace();
              if (result3 !== null) {
                result0 = [result0, result1, result2, result3];
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, n) { return parseInt(n.join(''), 10); })(pos0, result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_num255() {
        var result0, result1, result2;
        var pos0;
        
        pos0 = pos;
        if (input.substr(pos, 2) === "25") {
          result0 = "25";
          pos += 2;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"25\"");
          }
        }
        if (result0 !== null) {
          if (/^[0-5]/.test(input.charAt(pos))) {
            result1 = input.charAt(pos);
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("[0-5]");
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          if (input.charCodeAt(pos) === 50) {
            result0 = "2";
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"2\"");
            }
          }
          if (result0 !== null) {
            if (/^[0-4]/.test(input.charAt(pos))) {
              result1 = input.charAt(pos);
              pos++;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("[0-4]");
              }
            }
            if (result1 !== null) {
              if (/^[0-9]/.test(input.charAt(pos))) {
                result2 = input.charAt(pos);
                pos++;
              } else {
                result2 = null;
                if (reportFailures === 0) {
                  matchFailed("[0-9]");
                }
              }
              if (result2 !== null) {
                result0 = [result0, result1, result2];
              } else {
                result0 = null;
                pos = pos0;
              }
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
          if (result0 === null) {
            pos0 = pos;
            if (input.charCodeAt(pos) === 49) {
              result0 = "1";
              pos++;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"1\"");
              }
            }
            if (result0 !== null) {
              if (/^[0-9]/.test(input.charAt(pos))) {
                result1 = input.charAt(pos);
                pos++;
              } else {
                result1 = null;
                if (reportFailures === 0) {
                  matchFailed("[0-9]");
                }
              }
              if (result1 !== null) {
                if (/^[0-9]/.test(input.charAt(pos))) {
                  result2 = input.charAt(pos);
                  pos++;
                } else {
                  result2 = null;
                  if (reportFailures === 0) {
                    matchFailed("[0-9]");
                  }
                }
                if (result2 !== null) {
                  result0 = [result0, result1, result2];
                } else {
                  result0 = null;
                  pos = pos0;
                }
              } else {
                result0 = null;
                pos = pos0;
              }
            } else {
              result0 = null;
              pos = pos0;
            }
            if (result0 === null) {
              pos0 = pos;
              if (/^[0-9]/.test(input.charAt(pos))) {
                result0 = input.charAt(pos);
                pos++;
              } else {
                result0 = null;
                if (reportFailures === 0) {
                  matchFailed("[0-9]");
                }
              }
              if (result0 !== null) {
                if (/^[0-9]/.test(input.charAt(pos))) {
                  result1 = input.charAt(pos);
                  pos++;
                } else {
                  result1 = null;
                  if (reportFailures === 0) {
                    matchFailed("[0-9]");
                  }
                }
                result1 = result1 !== null ? result1 : "";
                if (result1 !== null) {
                  result0 = [result0, result1];
                } else {
                  result0 = null;
                  pos = pos0;
                }
              } else {
                result0 = null;
                pos = pos0;
              }
            }
          }
        }
        return result0;
      }
      
      function parse_number() {
        var result0, result1;
        var pos0, pos1;
        
        reportFailures++;
        pos0 = pos;
        pos1 = pos;
        result0 = parse_num2();
        if (result0 === null) {
          result0 = parse_num8();
          if (result0 === null) {
            result0 = parse_num10();
            if (result0 === null) {
              result0 = parse_num16();
            }
          }
        }
        if (result0 !== null) {
          result1 = parse__();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, n) { return n; })(pos0, result0[0]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("number");
        }
        return result0;
      }
      
      function parse_num2() {
        var result0, result1;
        var pos0, pos1;
        
        reportFailures++;
        pos0 = pos;
        pos1 = pos;
        result0 = parse_prefix2();
        if (result0 !== null) {
          result1 = parse_complex2();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, c) { return c; })(pos0, result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("binary number");
        }
        return result0;
      }
      
      function parse_complex2() {
        var result0, result1, result2, result3;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_real2();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 64) {
            result1 = "@";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"@\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_real2();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, radius, angle) {
                  var real = Math.cos(angle) * radius,
                      imag = Math.sin(angle) * radius;
                  return new Complex(real, imag);
              })(pos0, result0[0], result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          pos1 = pos;
          result0 = parse_infinity();
          if (result0 !== null) {
            if (input.charCodeAt(pos) === 105) {
              result1 = "i";
              pos++;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("\"i\"");
              }
            }
            if (result1 !== null) {
              result0 = [result0, result1];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
          if (result0 !== null) {
            result0 = (function(offset, i) { return new Complex(0, i);  })(pos0, result0[0]);
          }
          if (result0 === null) {
            pos = pos0;
          }
          if (result0 === null) {
            pos0 = pos;
            pos1 = pos;
            result0 = parse_real2();
            if (result0 !== null) {
              if (input.charCodeAt(pos) === 43) {
                result1 = "+";
                pos++;
              } else {
                result1 = null;
                if (reportFailures === 0) {
                  matchFailed("\"+\"");
                }
              }
              if (result1 !== null) {
                result2 = parse_ureal2();
                if (result2 !== null) {
                  if (input.charCodeAt(pos) === 105) {
                    result3 = "i";
                    pos++;
                  } else {
                    result3 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"i\"");
                    }
                  }
                  if (result3 !== null) {
                    result0 = [result0, result1, result2, result3];
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
            if (result0 !== null) {
              result0 = (function(offset, r, i) { return new Complex(r, i);  })(pos0, result0[0], result0[2]);
            }
            if (result0 === null) {
              pos = pos0;
            }
            if (result0 === null) {
              pos0 = pos;
              pos1 = pos;
              result0 = parse_real2();
              if (result0 !== null) {
                if (input.charCodeAt(pos) === 45) {
                  result1 = "-";
                  pos++;
                } else {
                  result1 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"-\"");
                  }
                }
                if (result1 !== null) {
                  result2 = parse_ureal2();
                  if (result2 !== null) {
                    if (input.charCodeAt(pos) === 105) {
                      result3 = "i";
                      pos++;
                    } else {
                      result3 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"i\"");
                      }
                    }
                    if (result3 !== null) {
                      result0 = [result0, result1, result2, result3];
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
              if (result0 !== null) {
                result0 = (function(offset, r, i) { return new Complex(r, -i); })(pos0, result0[0], result0[2]);
              }
              if (result0 === null) {
                pos = pos0;
              }
              if (result0 === null) {
                pos0 = pos;
                pos1 = pos;
                result0 = parse_real2();
                if (result0 !== null) {
                  result1 = parse_infinity();
                  if (result1 !== null) {
                    if (input.charCodeAt(pos) === 105) {
                      result2 = "i";
                      pos++;
                    } else {
                      result2 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"i\"");
                      }
                    }
                    if (result2 !== null) {
                      result0 = [result0, result1, result2];
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
                if (result0 !== null) {
                  result0 = (function(offset, r, i) { return new Complex(r, i);  })(pos0, result0[0], result0[1]);
                }
                if (result0 === null) {
                  pos = pos0;
                }
                if (result0 === null) {
                  pos0 = pos;
                  pos1 = pos;
                  result0 = parse_real2();
                  if (result0 !== null) {
                    if (input.substr(pos, 2) === "+i") {
                      result1 = "+i";
                      pos += 2;
                    } else {
                      result1 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"+i\"");
                      }
                    }
                    if (result1 !== null) {
                      result0 = [result0, result1];
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                  if (result0 !== null) {
                    result0 = (function(offset, r) { return new Complex(r, 1);  })(pos0, result0[0]);
                  }
                  if (result0 === null) {
                    pos = pos0;
                  }
                  if (result0 === null) {
                    pos0 = pos;
                    pos1 = pos;
                    result0 = parse_real2();
                    if (result0 !== null) {
                      if (input.substr(pos, 2) === "-i") {
                        result1 = "-i";
                        pos += 2;
                      } else {
                        result1 = null;
                        if (reportFailures === 0) {
                          matchFailed("\"-i\"");
                        }
                      }
                      if (result1 !== null) {
                        result0 = [result0, result1];
                      } else {
                        result0 = null;
                        pos = pos1;
                      }
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                    if (result0 !== null) {
                      result0 = (function(offset, r) { return new Complex(r, -1); })(pos0, result0[0]);
                    }
                    if (result0 === null) {
                      pos = pos0;
                    }
                    if (result0 === null) {
                      pos0 = pos;
                      pos1 = pos;
                      if (input.charCodeAt(pos) === 43) {
                        result0 = "+";
                        pos++;
                      } else {
                        result0 = null;
                        if (reportFailures === 0) {
                          matchFailed("\"+\"");
                        }
                      }
                      if (result0 !== null) {
                        result1 = parse_ureal2();
                        if (result1 !== null) {
                          if (input.charCodeAt(pos) === 105) {
                            result2 = "i";
                            pos++;
                          } else {
                            result2 = null;
                            if (reportFailures === 0) {
                              matchFailed("\"i\"");
                            }
                          }
                          if (result2 !== null) {
                            result0 = [result0, result1, result2];
                          } else {
                            result0 = null;
                            pos = pos1;
                          }
                        } else {
                          result0 = null;
                          pos = pos1;
                        }
                      } else {
                        result0 = null;
                        pos = pos1;
                      }
                      if (result0 !== null) {
                        result0 = (function(offset, i) { return new Complex(0, i);  })(pos0, result0[1]);
                      }
                      if (result0 === null) {
                        pos = pos0;
                      }
                      if (result0 === null) {
                        pos0 = pos;
                        pos1 = pos;
                        if (input.charCodeAt(pos) === 45) {
                          result0 = "-";
                          pos++;
                        } else {
                          result0 = null;
                          if (reportFailures === 0) {
                            matchFailed("\"-\"");
                          }
                        }
                        if (result0 !== null) {
                          result1 = parse_ureal2();
                          if (result1 !== null) {
                            if (input.charCodeAt(pos) === 105) {
                              result2 = "i";
                              pos++;
                            } else {
                              result2 = null;
                              if (reportFailures === 0) {
                                matchFailed("\"i\"");
                              }
                            }
                            if (result2 !== null) {
                              result0 = [result0, result1, result2];
                            } else {
                              result0 = null;
                              pos = pos1;
                            }
                          } else {
                            result0 = null;
                            pos = pos1;
                          }
                        } else {
                          result0 = null;
                          pos = pos1;
                        }
                        if (result0 !== null) {
                          result0 = (function(offset, i) { return new Complex(0, -i); })(pos0, result0[1]);
                        }
                        if (result0 === null) {
                          pos = pos0;
                        }
                        if (result0 === null) {
                          pos0 = pos;
                          result0 = parse_real2();
                          if (result0 !== null) {
                            result0 = (function(offset, r) { return new Real(r);        })(pos0, result0);
                          }
                          if (result0 === null) {
                            pos = pos0;
                          }
                          if (result0 === null) {
                            pos0 = pos;
                            if (input.substr(pos, 2) === "+i") {
                              result0 = "+i";
                              pos += 2;
                            } else {
                              result0 = null;
                              if (reportFailures === 0) {
                                matchFailed("\"+i\"");
                              }
                            }
                            if (result0 !== null) {
                              result0 = (function(offset) { return new Complex(0, 1);  })(pos0);
                            }
                            if (result0 === null) {
                              pos = pos0;
                            }
                            if (result0 === null) {
                              pos0 = pos;
                              if (input.substr(pos, 2) === "-i") {
                                result0 = "-i";
                                pos += 2;
                              } else {
                                result0 = null;
                                if (reportFailures === 0) {
                                  matchFailed("\"-i\"");
                                }
                              }
                              if (result0 !== null) {
                                result0 = (function(offset) { return new Complex(0, -1); })(pos0);
                              }
                              if (result0 === null) {
                                pos = pos0;
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        return result0;
      }
      
      function parse_real2() {
        var result0, result1;
        var pos0, pos1;
        
        result0 = parse_infinity();
        if (result0 === null) {
          pos0 = pos;
          pos1 = pos;
          result0 = parse_sign();
          if (result0 !== null) {
            result1 = parse_ureal2();
            if (result1 !== null) {
              result0 = [result0, result1];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
          if (result0 !== null) {
            result0 = (function(offset, s, u) { return s === '-' ? -u : u; })(pos0, result0[0], result0[1]);
          }
          if (result0 === null) {
            pos = pos0;
          }
        }
        return result0;
      }
      
      function parse_ureal2() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_uinteger2();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 47) {
            result1 = "/";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"/\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_uinteger2();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, numer, denom) { return numer / denom; })(pos0, result0[0], result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          result0 = parse_uinteger2();
        }
        return result0;
      }
      
      function parse_uinteger2() {
        var result0, result1;
        var pos0;
        
        pos0 = pos;
        result1 = parse_digit2();
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            result1 = parse_digit2();
          }
        } else {
          result0 = null;
        }
        if (result0 !== null) {
          result0 = (function(offset, ds) { return parseInt(ds.join(''), 2); })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_prefix2() {
        var result0, result1;
        var pos0;
        
        pos0 = pos;
        result0 = parse_radix2();
        if (result0 !== null) {
          result1 = parse_exactness();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          result0 = parse_exactness();
          if (result0 !== null) {
            result1 = parse_radix2();
            if (result1 !== null) {
              result0 = [result0, result1];
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        }
        return result0;
      }
      
      function parse_num8() {
        var result0, result1;
        var pos0, pos1;
        
        reportFailures++;
        pos0 = pos;
        pos1 = pos;
        result0 = parse_prefix8();
        if (result0 !== null) {
          result1 = parse_complex8();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, c) { return c; })(pos0, result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("octal number");
        }
        return result0;
      }
      
      function parse_complex8() {
        var result0, result1, result2, result3;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_real8();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 64) {
            result1 = "@";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"@\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_real8();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, radius, angle) {
                  var real = Math.cos(angle) * radius,
                      imag = Math.sin(angle) * radius;
                  return new Complex(real, imag);
              })(pos0, result0[0], result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          pos1 = pos;
          result0 = parse_infinity();
          if (result0 !== null) {
            if (input.charCodeAt(pos) === 105) {
              result1 = "i";
              pos++;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("\"i\"");
              }
            }
            if (result1 !== null) {
              result0 = [result0, result1];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
          if (result0 !== null) {
            result0 = (function(offset, i) { return new Complex(0, i);  })(pos0, result0[0]);
          }
          if (result0 === null) {
            pos = pos0;
          }
          if (result0 === null) {
            pos0 = pos;
            pos1 = pos;
            result0 = parse_real8();
            if (result0 !== null) {
              if (input.charCodeAt(pos) === 43) {
                result1 = "+";
                pos++;
              } else {
                result1 = null;
                if (reportFailures === 0) {
                  matchFailed("\"+\"");
                }
              }
              if (result1 !== null) {
                result2 = parse_ureal8();
                if (result2 !== null) {
                  if (input.charCodeAt(pos) === 105) {
                    result3 = "i";
                    pos++;
                  } else {
                    result3 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"i\"");
                    }
                  }
                  if (result3 !== null) {
                    result0 = [result0, result1, result2, result3];
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
            if (result0 !== null) {
              result0 = (function(offset, r, i) { return new Complex(r, i);  })(pos0, result0[0], result0[2]);
            }
            if (result0 === null) {
              pos = pos0;
            }
            if (result0 === null) {
              pos0 = pos;
              pos1 = pos;
              result0 = parse_real8();
              if (result0 !== null) {
                if (input.charCodeAt(pos) === 45) {
                  result1 = "-";
                  pos++;
                } else {
                  result1 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"-\"");
                  }
                }
                if (result1 !== null) {
                  result2 = parse_ureal8();
                  if (result2 !== null) {
                    if (input.charCodeAt(pos) === 105) {
                      result3 = "i";
                      pos++;
                    } else {
                      result3 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"i\"");
                      }
                    }
                    if (result3 !== null) {
                      result0 = [result0, result1, result2, result3];
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
              if (result0 !== null) {
                result0 = (function(offset, r, i) { return new Complex(r, -i); })(pos0, result0[0], result0[2]);
              }
              if (result0 === null) {
                pos = pos0;
              }
              if (result0 === null) {
                pos0 = pos;
                pos1 = pos;
                result0 = parse_real8();
                if (result0 !== null) {
                  result1 = parse_infinity();
                  if (result1 !== null) {
                    if (input.charCodeAt(pos) === 105) {
                      result2 = "i";
                      pos++;
                    } else {
                      result2 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"i\"");
                      }
                    }
                    if (result2 !== null) {
                      result0 = [result0, result1, result2];
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
                if (result0 !== null) {
                  result0 = (function(offset, r, i) { return new Complex(r, i);  })(pos0, result0[0], result0[1]);
                }
                if (result0 === null) {
                  pos = pos0;
                }
                if (result0 === null) {
                  pos0 = pos;
                  pos1 = pos;
                  result0 = parse_real8();
                  if (result0 !== null) {
                    if (input.substr(pos, 2) === "+i") {
                      result1 = "+i";
                      pos += 2;
                    } else {
                      result1 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"+i\"");
                      }
                    }
                    if (result1 !== null) {
                      result0 = [result0, result1];
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                  if (result0 !== null) {
                    result0 = (function(offset, r) { return new Complex(r, 1);  })(pos0, result0[0]);
                  }
                  if (result0 === null) {
                    pos = pos0;
                  }
                  if (result0 === null) {
                    pos0 = pos;
                    pos1 = pos;
                    result0 = parse_real8();
                    if (result0 !== null) {
                      if (input.substr(pos, 2) === "-i") {
                        result1 = "-i";
                        pos += 2;
                      } else {
                        result1 = null;
                        if (reportFailures === 0) {
                          matchFailed("\"-i\"");
                        }
                      }
                      if (result1 !== null) {
                        result0 = [result0, result1];
                      } else {
                        result0 = null;
                        pos = pos1;
                      }
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                    if (result0 !== null) {
                      result0 = (function(offset, r) { return new Complex(r, -1); })(pos0, result0[0]);
                    }
                    if (result0 === null) {
                      pos = pos0;
                    }
                    if (result0 === null) {
                      pos0 = pos;
                      pos1 = pos;
                      if (input.charCodeAt(pos) === 43) {
                        result0 = "+";
                        pos++;
                      } else {
                        result0 = null;
                        if (reportFailures === 0) {
                          matchFailed("\"+\"");
                        }
                      }
                      if (result0 !== null) {
                        result1 = parse_ureal8();
                        if (result1 !== null) {
                          if (input.charCodeAt(pos) === 105) {
                            result2 = "i";
                            pos++;
                          } else {
                            result2 = null;
                            if (reportFailures === 0) {
                              matchFailed("\"i\"");
                            }
                          }
                          if (result2 !== null) {
                            result0 = [result0, result1, result2];
                          } else {
                            result0 = null;
                            pos = pos1;
                          }
                        } else {
                          result0 = null;
                          pos = pos1;
                        }
                      } else {
                        result0 = null;
                        pos = pos1;
                      }
                      if (result0 !== null) {
                        result0 = (function(offset, i) { return new Complex(0, i);  })(pos0, result0[1]);
                      }
                      if (result0 === null) {
                        pos = pos0;
                      }
                      if (result0 === null) {
                        pos0 = pos;
                        pos1 = pos;
                        if (input.charCodeAt(pos) === 45) {
                          result0 = "-";
                          pos++;
                        } else {
                          result0 = null;
                          if (reportFailures === 0) {
                            matchFailed("\"-\"");
                          }
                        }
                        if (result0 !== null) {
                          result1 = parse_ureal8();
                          if (result1 !== null) {
                            if (input.charCodeAt(pos) === 105) {
                              result2 = "i";
                              pos++;
                            } else {
                              result2 = null;
                              if (reportFailures === 0) {
                                matchFailed("\"i\"");
                              }
                            }
                            if (result2 !== null) {
                              result0 = [result0, result1, result2];
                            } else {
                              result0 = null;
                              pos = pos1;
                            }
                          } else {
                            result0 = null;
                            pos = pos1;
                          }
                        } else {
                          result0 = null;
                          pos = pos1;
                        }
                        if (result0 !== null) {
                          result0 = (function(offset, i) { return new Complex(0, -i); })(pos0, result0[1]);
                        }
                        if (result0 === null) {
                          pos = pos0;
                        }
                        if (result0 === null) {
                          pos0 = pos;
                          result0 = parse_real8();
                          if (result0 !== null) {
                            result0 = (function(offset, r) { return new Real(r);        })(pos0, result0);
                          }
                          if (result0 === null) {
                            pos = pos0;
                          }
                          if (result0 === null) {
                            pos0 = pos;
                            if (input.substr(pos, 2) === "+i") {
                              result0 = "+i";
                              pos += 2;
                            } else {
                              result0 = null;
                              if (reportFailures === 0) {
                                matchFailed("\"+i\"");
                              }
                            }
                            if (result0 !== null) {
                              result0 = (function(offset) { return new Complex(0, 1);  })(pos0);
                            }
                            if (result0 === null) {
                              pos = pos0;
                            }
                            if (result0 === null) {
                              pos0 = pos;
                              if (input.substr(pos, 2) === "-i") {
                                result0 = "-i";
                                pos += 2;
                              } else {
                                result0 = null;
                                if (reportFailures === 0) {
                                  matchFailed("\"-i\"");
                                }
                              }
                              if (result0 !== null) {
                                result0 = (function(offset) { return new Complex(0, -1); })(pos0);
                              }
                              if (result0 === null) {
                                pos = pos0;
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        return result0;
      }
      
      function parse_real8() {
        var result0, result1;
        var pos0, pos1;
        
        result0 = parse_infinity();
        if (result0 === null) {
          pos0 = pos;
          pos1 = pos;
          result0 = parse_sign();
          if (result0 !== null) {
            result1 = parse_ureal8();
            if (result1 !== null) {
              result0 = [result0, result1];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
          if (result0 !== null) {
            result0 = (function(offset, s, u) { return s === '-' ? -u : u; })(pos0, result0[0], result0[1]);
          }
          if (result0 === null) {
            pos = pos0;
          }
        }
        return result0;
      }
      
      function parse_ureal8() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_uinteger8();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 47) {
            result1 = "/";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"/\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_uinteger8();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, numer, denom) { return numer / denom; })(pos0, result0[0], result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          result0 = parse_uinteger8();
        }
        return result0;
      }
      
      function parse_uinteger8() {
        var result0, result1;
        var pos0;
        
        pos0 = pos;
        result1 = parse_digit8();
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            result1 = parse_digit8();
          }
        } else {
          result0 = null;
        }
        if (result0 !== null) {
          result0 = (function(offset, ds) { return parseInt(ds.join(''), 8); })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_prefix8() {
        var result0, result1;
        var pos0;
        
        pos0 = pos;
        result0 = parse_radix8();
        if (result0 !== null) {
          result1 = parse_exactness();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          result0 = parse_exactness();
          if (result0 !== null) {
            result1 = parse_radix8();
            if (result1 !== null) {
              result0 = [result0, result1];
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        }
        return result0;
      }
      
      function parse_num10() {
        var result0, result1;
        var pos0, pos1;
        
        reportFailures++;
        pos0 = pos;
        pos1 = pos;
        result0 = parse_prefix10();
        if (result0 !== null) {
          result1 = parse_complex10();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, c) { return c; })(pos0, result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("decimal number");
        }
        return result0;
      }
      
      function parse_complex10() {
        var result0, result1, result2, result3;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_real10();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 64) {
            result1 = "@";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"@\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_real10();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, radius, angle) {
                  var real = Math.cos(angle) * radius,
                      imag = Math.sin(angle) * radius;
                  return new Complex(real, imag);
              })(pos0, result0[0], result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          pos1 = pos;
          result0 = parse_infinity();
          if (result0 !== null) {
            if (input.charCodeAt(pos) === 105) {
              result1 = "i";
              pos++;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("\"i\"");
              }
            }
            if (result1 !== null) {
              result0 = [result0, result1];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
          if (result0 !== null) {
            result0 = (function(offset, i) { return new Complex(0, i);  })(pos0, result0[0]);
          }
          if (result0 === null) {
            pos = pos0;
          }
          if (result0 === null) {
            pos0 = pos;
            pos1 = pos;
            result0 = parse_real10();
            if (result0 !== null) {
              if (input.charCodeAt(pos) === 43) {
                result1 = "+";
                pos++;
              } else {
                result1 = null;
                if (reportFailures === 0) {
                  matchFailed("\"+\"");
                }
              }
              if (result1 !== null) {
                result2 = parse_ureal10();
                if (result2 !== null) {
                  if (input.charCodeAt(pos) === 105) {
                    result3 = "i";
                    pos++;
                  } else {
                    result3 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"i\"");
                    }
                  }
                  if (result3 !== null) {
                    result0 = [result0, result1, result2, result3];
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
            if (result0 !== null) {
              result0 = (function(offset, r, i) { return new Complex(r, i);  })(pos0, result0[0], result0[2]);
            }
            if (result0 === null) {
              pos = pos0;
            }
            if (result0 === null) {
              pos0 = pos;
              pos1 = pos;
              result0 = parse_real10();
              if (result0 !== null) {
                if (input.charCodeAt(pos) === 45) {
                  result1 = "-";
                  pos++;
                } else {
                  result1 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"-\"");
                  }
                }
                if (result1 !== null) {
                  result2 = parse_ureal10();
                  if (result2 !== null) {
                    if (input.charCodeAt(pos) === 105) {
                      result3 = "i";
                      pos++;
                    } else {
                      result3 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"i\"");
                      }
                    }
                    if (result3 !== null) {
                      result0 = [result0, result1, result2, result3];
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
              if (result0 !== null) {
                result0 = (function(offset, r, i) { return new Complex(r, -i); })(pos0, result0[0], result0[2]);
              }
              if (result0 === null) {
                pos = pos0;
              }
              if (result0 === null) {
                pos0 = pos;
                pos1 = pos;
                result0 = parse_real10();
                if (result0 !== null) {
                  result1 = parse_infinity();
                  if (result1 !== null) {
                    if (input.charCodeAt(pos) === 105) {
                      result2 = "i";
                      pos++;
                    } else {
                      result2 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"i\"");
                      }
                    }
                    if (result2 !== null) {
                      result0 = [result0, result1, result2];
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
                if (result0 !== null) {
                  result0 = (function(offset, r, i) { return new Complex(r, i);  })(pos0, result0[0], result0[1]);
                }
                if (result0 === null) {
                  pos = pos0;
                }
                if (result0 === null) {
                  pos0 = pos;
                  pos1 = pos;
                  result0 = parse_real10();
                  if (result0 !== null) {
                    if (input.substr(pos, 2) === "+i") {
                      result1 = "+i";
                      pos += 2;
                    } else {
                      result1 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"+i\"");
                      }
                    }
                    if (result1 !== null) {
                      result0 = [result0, result1];
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                  if (result0 !== null) {
                    result0 = (function(offset, r) { return new Complex(r, 1);  })(pos0, result0[0]);
                  }
                  if (result0 === null) {
                    pos = pos0;
                  }
                  if (result0 === null) {
                    pos0 = pos;
                    pos1 = pos;
                    result0 = parse_real10();
                    if (result0 !== null) {
                      if (input.substr(pos, 2) === "-i") {
                        result1 = "-i";
                        pos += 2;
                      } else {
                        result1 = null;
                        if (reportFailures === 0) {
                          matchFailed("\"-i\"");
                        }
                      }
                      if (result1 !== null) {
                        result0 = [result0, result1];
                      } else {
                        result0 = null;
                        pos = pos1;
                      }
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                    if (result0 !== null) {
                      result0 = (function(offset, r) { return new Complex(r, -1); })(pos0, result0[0]);
                    }
                    if (result0 === null) {
                      pos = pos0;
                    }
                    if (result0 === null) {
                      pos0 = pos;
                      pos1 = pos;
                      if (input.charCodeAt(pos) === 43) {
                        result0 = "+";
                        pos++;
                      } else {
                        result0 = null;
                        if (reportFailures === 0) {
                          matchFailed("\"+\"");
                        }
                      }
                      if (result0 !== null) {
                        result1 = parse_ureal10();
                        if (result1 !== null) {
                          if (input.charCodeAt(pos) === 105) {
                            result2 = "i";
                            pos++;
                          } else {
                            result2 = null;
                            if (reportFailures === 0) {
                              matchFailed("\"i\"");
                            }
                          }
                          if (result2 !== null) {
                            result0 = [result0, result1, result2];
                          } else {
                            result0 = null;
                            pos = pos1;
                          }
                        } else {
                          result0 = null;
                          pos = pos1;
                        }
                      } else {
                        result0 = null;
                        pos = pos1;
                      }
                      if (result0 !== null) {
                        result0 = (function(offset, i) { return new Complex(0, i);  })(pos0, result0[1]);
                      }
                      if (result0 === null) {
                        pos = pos0;
                      }
                      if (result0 === null) {
                        pos0 = pos;
                        pos1 = pos;
                        if (input.charCodeAt(pos) === 45) {
                          result0 = "-";
                          pos++;
                        } else {
                          result0 = null;
                          if (reportFailures === 0) {
                            matchFailed("\"-\"");
                          }
                        }
                        if (result0 !== null) {
                          result1 = parse_ureal10();
                          if (result1 !== null) {
                            if (input.charCodeAt(pos) === 105) {
                              result2 = "i";
                              pos++;
                            } else {
                              result2 = null;
                              if (reportFailures === 0) {
                                matchFailed("\"i\"");
                              }
                            }
                            if (result2 !== null) {
                              result0 = [result0, result1, result2];
                            } else {
                              result0 = null;
                              pos = pos1;
                            }
                          } else {
                            result0 = null;
                            pos = pos1;
                          }
                        } else {
                          result0 = null;
                          pos = pos1;
                        }
                        if (result0 !== null) {
                          result0 = (function(offset, i) { return new Complex(0, -i); })(pos0, result0[1]);
                        }
                        if (result0 === null) {
                          pos = pos0;
                        }
                        if (result0 === null) {
                          pos0 = pos;
                          result0 = parse_real10();
                          if (result0 !== null) {
                            result0 = (function(offset, r) { return new Real(r);        })(pos0, result0);
                          }
                          if (result0 === null) {
                            pos = pos0;
                          }
                          if (result0 === null) {
                            pos0 = pos;
                            if (input.substr(pos, 2) === "+i") {
                              result0 = "+i";
                              pos += 2;
                            } else {
                              result0 = null;
                              if (reportFailures === 0) {
                                matchFailed("\"+i\"");
                              }
                            }
                            if (result0 !== null) {
                              result0 = (function(offset) { return new Complex(0, 1);  })(pos0);
                            }
                            if (result0 === null) {
                              pos = pos0;
                            }
                            if (result0 === null) {
                              pos0 = pos;
                              if (input.substr(pos, 2) === "-i") {
                                result0 = "-i";
                                pos += 2;
                              } else {
                                result0 = null;
                                if (reportFailures === 0) {
                                  matchFailed("\"-i\"");
                                }
                              }
                              if (result0 !== null) {
                                result0 = (function(offset) { return new Complex(0, -1); })(pos0);
                              }
                              if (result0 === null) {
                                pos = pos0;
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        return result0;
      }
      
      function parse_real10() {
        var result0, result1;
        var pos0, pos1;
        
        result0 = parse_infinity();
        if (result0 === null) {
          pos0 = pos;
          pos1 = pos;
          result0 = parse_sign();
          if (result0 !== null) {
            result1 = parse_ureal10();
            if (result1 !== null) {
              result0 = [result0, result1];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
          if (result0 !== null) {
            result0 = (function(offset, s, u) { return s === '-' ? -u : u; })(pos0, result0[0], result0[1]);
          }
          if (result0 === null) {
            pos = pos0;
          }
        }
        return result0;
      }
      
      function parse_ureal10() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_uinteger10();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 47) {
            result1 = "/";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"/\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_uinteger10();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, numer, denom) { return numer / denom; })(pos0, result0[0], result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          result0 = parse_decimal10();
          if (result0 === null) {
            result0 = parse_uinteger10();
          }
        }
        return result0;
      }
      
      function parse_decimal10() {
        var result0, result1, result2, result3;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 46) {
          result0 = ".";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\".\"");
          }
        }
        if (result0 !== null) {
          result2 = parse_digit();
          if (result2 !== null) {
            result1 = [];
            while (result2 !== null) {
              result1.push(result2);
              result2 = parse_digit();
            }
          } else {
            result1 = null;
          }
          if (result1 !== null) {
            result2 = parse_suffix();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, ds, s) {
                  var num = parseFloat('.' + ds.join(''));
                  if (s) {
                      num *= Math.pow(10, s);
                  }
                  return num;
              })(pos0, result0[1], result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          pos1 = pos;
          result1 = parse_digit();
          if (result1 !== null) {
            result0 = [];
            while (result1 !== null) {
              result0.push(result1);
              result1 = parse_digit();
            }
          } else {
            result0 = null;
          }
          if (result0 !== null) {
            if (input.charCodeAt(pos) === 46) {
              result1 = ".";
              pos++;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("\".\"");
              }
            }
            if (result1 !== null) {
              result2 = [];
              result3 = parse_digit();
              while (result3 !== null) {
                result2.push(result3);
                result3 = parse_digit();
              }
              if (result2 !== null) {
                result3 = parse_suffix();
                if (result3 !== null) {
                  result0 = [result0, result1, result2, result3];
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
          if (result0 !== null) {
            result0 = (function(offset, whole, fraction, s) {
                    var num = parseInt(whole.join(''), 10) + parseFloat('.' + fraction.join(''));
                    if (s) {
                        num *= Math.pow(10, s);
                    }
                    return num;
                })(pos0, result0[0], result0[2], result0[3]);
          }
          if (result0 === null) {
            pos = pos0;
          }
          if (result0 === null) {
            pos0 = pos;
            pos1 = pos;
            result0 = parse_uinteger10();
            if (result0 !== null) {
              result1 = parse_suffix();
              if (result1 !== null) {
                result0 = [result0, result1];
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
            if (result0 !== null) {
              result0 = (function(offset, u, s) {
                      if (s) {
                          u *= Math.pow(10, s);
                      }
                      return u;
                  })(pos0, result0[0], result0[1]);
            }
            if (result0 === null) {
              pos = pos0;
            }
          }
        }
        return result0;
      }
      
      function parse_suffix() {
        var result0, result1, result2, result3;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_exponentMarker();
        if (result0 !== null) {
          result1 = parse_sign();
          if (result1 !== null) {
            result3 = parse_digit();
            if (result3 !== null) {
              result2 = [];
              while (result3 !== null) {
                result2.push(result3);
                result3 = parse_digit();
              }
            } else {
              result2 = null;
            }
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, e, s, ds) {
                  return parseInt(ds.join(''), 10) * (s === '-' ? -1: 1);
              })(pos0, result0[0], result0[1], result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          result0 = parse_empty();
        }
        return result0;
      }
      
      function parse_exponentMarker() {
        var result0;
        
        if (/^[esfdl]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[esfdl]");
          }
        }
        return result0;
      }
      
      function parse_uinteger10() {
        var result0, result1;
        var pos0;
        
        pos0 = pos;
        result1 = parse_digit();
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            result1 = parse_digit();
          }
        } else {
          result0 = null;
        }
        if (result0 !== null) {
          result0 = (function(offset, ds) { return parseInt(ds.join(''), 10); })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_prefix10() {
        var result0, result1;
        var pos0;
        
        pos0 = pos;
        result0 = parse_radix10();
        if (result0 !== null) {
          result1 = parse_exactness();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          result0 = parse_exactness();
          if (result0 !== null) {
            result1 = parse_radix10();
            if (result1 !== null) {
              result0 = [result0, result1];
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        }
        return result0;
      }
      
      function parse_num16() {
        var result0, result1;
        var pos0, pos1;
        
        reportFailures++;
        pos0 = pos;
        pos1 = pos;
        result0 = parse_prefix16();
        if (result0 !== null) {
          result1 = parse_complex16();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, c) { return c; })(pos0, result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("hexadecimal number");
        }
        return result0;
      }
      
      function parse_complex16() {
        var result0, result1, result2, result3;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_real16();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 64) {
            result1 = "@";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"@\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_real16();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, radius, angle) {
                  var real = Math.cos(angle) * radius,
                      imag = Math.sin(angle) * radius;
                  return new Complex(real, imag);
              })(pos0, result0[0], result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          pos1 = pos;
          result0 = parse_infinity();
          if (result0 !== null) {
            if (input.charCodeAt(pos) === 105) {
              result1 = "i";
              pos++;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("\"i\"");
              }
            }
            if (result1 !== null) {
              result0 = [result0, result1];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
          if (result0 !== null) {
            result0 = (function(offset, i) { return new Complex(0, i);  })(pos0, result0[0]);
          }
          if (result0 === null) {
            pos = pos0;
          }
          if (result0 === null) {
            pos0 = pos;
            pos1 = pos;
            result0 = parse_real16();
            if (result0 !== null) {
              if (input.charCodeAt(pos) === 43) {
                result1 = "+";
                pos++;
              } else {
                result1 = null;
                if (reportFailures === 0) {
                  matchFailed("\"+\"");
                }
              }
              if (result1 !== null) {
                result2 = parse_ureal16();
                if (result2 !== null) {
                  if (input.charCodeAt(pos) === 105) {
                    result3 = "i";
                    pos++;
                  } else {
                    result3 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"i\"");
                    }
                  }
                  if (result3 !== null) {
                    result0 = [result0, result1, result2, result3];
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
            if (result0 !== null) {
              result0 = (function(offset, r, i) { return new Complex(r, i);  })(pos0, result0[0], result0[2]);
            }
            if (result0 === null) {
              pos = pos0;
            }
            if (result0 === null) {
              pos0 = pos;
              pos1 = pos;
              result0 = parse_real16();
              if (result0 !== null) {
                if (input.charCodeAt(pos) === 45) {
                  result1 = "-";
                  pos++;
                } else {
                  result1 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"-\"");
                  }
                }
                if (result1 !== null) {
                  result2 = parse_ureal16();
                  if (result2 !== null) {
                    if (input.charCodeAt(pos) === 105) {
                      result3 = "i";
                      pos++;
                    } else {
                      result3 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"i\"");
                      }
                    }
                    if (result3 !== null) {
                      result0 = [result0, result1, result2, result3];
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
              if (result0 !== null) {
                result0 = (function(offset, r, i) { return new Complex(r, -i); })(pos0, result0[0], result0[2]);
              }
              if (result0 === null) {
                pos = pos0;
              }
              if (result0 === null) {
                pos0 = pos;
                pos1 = pos;
                result0 = parse_real16();
                if (result0 !== null) {
                  result1 = parse_infinity();
                  if (result1 !== null) {
                    if (input.charCodeAt(pos) === 105) {
                      result2 = "i";
                      pos++;
                    } else {
                      result2 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"i\"");
                      }
                    }
                    if (result2 !== null) {
                      result0 = [result0, result1, result2];
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
                if (result0 !== null) {
                  result0 = (function(offset, r, i) { return new Complex(r, i);  })(pos0, result0[0], result0[1]);
                }
                if (result0 === null) {
                  pos = pos0;
                }
                if (result0 === null) {
                  pos0 = pos;
                  pos1 = pos;
                  result0 = parse_real16();
                  if (result0 !== null) {
                    if (input.substr(pos, 2) === "+i") {
                      result1 = "+i";
                      pos += 2;
                    } else {
                      result1 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"+i\"");
                      }
                    }
                    if (result1 !== null) {
                      result0 = [result0, result1];
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                  if (result0 !== null) {
                    result0 = (function(offset, r) { return new Complex(r, 1);  })(pos0, result0[0]);
                  }
                  if (result0 === null) {
                    pos = pos0;
                  }
                  if (result0 === null) {
                    pos0 = pos;
                    pos1 = pos;
                    result0 = parse_real16();
                    if (result0 !== null) {
                      if (input.substr(pos, 2) === "-i") {
                        result1 = "-i";
                        pos += 2;
                      } else {
                        result1 = null;
                        if (reportFailures === 0) {
                          matchFailed("\"-i\"");
                        }
                      }
                      if (result1 !== null) {
                        result0 = [result0, result1];
                      } else {
                        result0 = null;
                        pos = pos1;
                      }
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                    if (result0 !== null) {
                      result0 = (function(offset, r) { return new Complex(r, -1); })(pos0, result0[0]);
                    }
                    if (result0 === null) {
                      pos = pos0;
                    }
                    if (result0 === null) {
                      pos0 = pos;
                      pos1 = pos;
                      if (input.charCodeAt(pos) === 43) {
                        result0 = "+";
                        pos++;
                      } else {
                        result0 = null;
                        if (reportFailures === 0) {
                          matchFailed("\"+\"");
                        }
                      }
                      if (result0 !== null) {
                        result1 = parse_ureal16();
                        if (result1 !== null) {
                          if (input.charCodeAt(pos) === 105) {
                            result2 = "i";
                            pos++;
                          } else {
                            result2 = null;
                            if (reportFailures === 0) {
                              matchFailed("\"i\"");
                            }
                          }
                          if (result2 !== null) {
                            result0 = [result0, result1, result2];
                          } else {
                            result0 = null;
                            pos = pos1;
                          }
                        } else {
                          result0 = null;
                          pos = pos1;
                        }
                      } else {
                        result0 = null;
                        pos = pos1;
                      }
                      if (result0 !== null) {
                        result0 = (function(offset, i) { return new Complex(0, i);  })(pos0, result0[1]);
                      }
                      if (result0 === null) {
                        pos = pos0;
                      }
                      if (result0 === null) {
                        pos0 = pos;
                        pos1 = pos;
                        if (input.charCodeAt(pos) === 45) {
                          result0 = "-";
                          pos++;
                        } else {
                          result0 = null;
                          if (reportFailures === 0) {
                            matchFailed("\"-\"");
                          }
                        }
                        if (result0 !== null) {
                          result1 = parse_ureal16();
                          if (result1 !== null) {
                            if (input.charCodeAt(pos) === 105) {
                              result2 = "i";
                              pos++;
                            } else {
                              result2 = null;
                              if (reportFailures === 0) {
                                matchFailed("\"i\"");
                              }
                            }
                            if (result2 !== null) {
                              result0 = [result0, result1, result2];
                            } else {
                              result0 = null;
                              pos = pos1;
                            }
                          } else {
                            result0 = null;
                            pos = pos1;
                          }
                        } else {
                          result0 = null;
                          pos = pos1;
                        }
                        if (result0 !== null) {
                          result0 = (function(offset, i) { return new Complex(0, -i); })(pos0, result0[1]);
                        }
                        if (result0 === null) {
                          pos = pos0;
                        }
                        if (result0 === null) {
                          pos0 = pos;
                          result0 = parse_real16();
                          if (result0 !== null) {
                            result0 = (function(offset, r) { return new Real(r);        })(pos0, result0);
                          }
                          if (result0 === null) {
                            pos = pos0;
                          }
                          if (result0 === null) {
                            pos0 = pos;
                            if (input.substr(pos, 2) === "+i") {
                              result0 = "+i";
                              pos += 2;
                            } else {
                              result0 = null;
                              if (reportFailures === 0) {
                                matchFailed("\"+i\"");
                              }
                            }
                            if (result0 !== null) {
                              result0 = (function(offset) { return new Complex(0, 1);  })(pos0);
                            }
                            if (result0 === null) {
                              pos = pos0;
                            }
                            if (result0 === null) {
                              pos0 = pos;
                              if (input.substr(pos, 2) === "-i") {
                                result0 = "-i";
                                pos += 2;
                              } else {
                                result0 = null;
                                if (reportFailures === 0) {
                                  matchFailed("\"-i\"");
                                }
                              }
                              if (result0 !== null) {
                                result0 = (function(offset) { return new Complex(0, -1); })(pos0);
                              }
                              if (result0 === null) {
                                pos = pos0;
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        return result0;
      }
      
      function parse_real16() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_sign();
        if (result0 !== null) {
          result1 = parse_ureal16();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, s, u) { return s === '-' ? -u : u; })(pos0, result0[0], result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          result0 = parse_infinity();
        }
        return result0;
      }
      
      function parse_ureal16() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_uinteger16();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 47) {
            result1 = "/";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"/\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_uinteger16();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, numer, denom) { return numer / denom; })(pos0, result0[0], result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          result0 = parse_uinteger16();
        }
        return result0;
      }
      
      function parse_uinteger16() {
        var result0, result1;
        var pos0;
        
        pos0 = pos;
        result1 = parse_digit16();
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            result1 = parse_digit16();
          }
        } else {
          result0 = null;
        }
        if (result0 !== null) {
          result0 = (function(offset, ds) { return parseInt(ds.join(''), 16); })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_prefix16() {
        var result0, result1;
        var pos0;
        
        pos0 = pos;
        result0 = parse_radix16();
        if (result0 !== null) {
          result1 = parse_exactness();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          result0 = parse_exactness();
          if (result0 !== null) {
            result1 = parse_radix16();
            if (result1 !== null) {
              result0 = [result0, result1];
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        }
        return result0;
      }
      
      function parse_infinity() {
        var result0;
        var pos0;
        
        pos0 = pos;
        if (input.substr(pos, 6).toLowerCase() === "+inf.0") {
          result0 = input.substr(pos, 6);
          pos += 6;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"+inf.0\"");
          }
        }
        if (result0 !== null) {
          result0 = (function(offset) { return Infinity; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          if (input.substr(pos, 6).toLowerCase() === "-inf.0") {
            result0 = input.substr(pos, 6);
            pos += 6;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"-inf.0\"");
            }
          }
          if (result0 !== null) {
            result0 = (function(offset) { return -Infinity; })(pos0);
          }
          if (result0 === null) {
            pos = pos0;
          }
          if (result0 === null) {
            pos0 = pos;
            if (input.substr(pos, 6).toLowerCase() === "+nan.0") {
              result0 = input.substr(pos, 6);
              pos += 6;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"+nan.0\"");
              }
            }
            if (result0 !== null) {
              result0 = (function(offset) { return NaN; })(pos0);
            }
            if (result0 === null) {
              pos = pos0;
            }
          }
        }
        return result0;
      }
      
      function parse_sign() {
        var result0;
        
        if (/^[+\-]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[+\\-]");
          }
        }
        result0 = result0 !== null ? result0 : "";
        return result0;
      }
      
      function parse_exactness() {
        var result0;
        
        if (input.substr(pos, 2).toLowerCase() === "#i") {
          result0 = input.substr(pos, 2);
          pos += 2;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"#i\"");
          }
        }
        if (result0 === null) {
          if (input.substr(pos, 2).toLowerCase() === "#e") {
            result0 = input.substr(pos, 2);
            pos += 2;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"#e\"");
            }
          }
          if (result0 === null) {
            result0 = parse_empty();
          }
        }
        return result0;
      }
      
      function parse_radix2() {
        var result0;
        
        if (input.substr(pos, 2).toLowerCase() === "#b") {
          result0 = input.substr(pos, 2);
          pos += 2;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"#b\"");
          }
        }
        return result0;
      }
      
      function parse_radix8() {
        var result0;
        
        if (input.substr(pos, 2).toLowerCase() === "#o") {
          result0 = input.substr(pos, 2);
          pos += 2;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"#o\"");
          }
        }
        return result0;
      }
      
      function parse_radix10() {
        var result0;
        
        if (input.substr(pos, 2).toLowerCase() === "#d") {
          result0 = input.substr(pos, 2);
          pos += 2;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"#d\"");
          }
        }
        result0 = result0 !== null ? result0 : "";
        return result0;
      }
      
      function parse_radix16() {
        var result0;
        
        if (input.substr(pos, 2).toLowerCase() === "#x") {
          result0 = input.substr(pos, 2);
          pos += 2;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"#x\"");
          }
        }
        return result0;
      }
      
      function parse_digit2() {
        var result0;
        
        if (/^[01]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[01]");
          }
        }
        return result0;
      }
      
      function parse_digit8() {
        var result0;
        
        if (/^[01234567]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[01234567]");
          }
        }
        return result0;
      }
      
      function parse_digit16() {
        var result0;
        
        result0 = parse_digit();
        if (result0 === null) {
          if (/^[abcdef]/i.test(input.charAt(pos))) {
            result0 = input.charAt(pos);
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("[abcdef]i");
            }
          }
        }
        return result0;
      }
      
      function parse_empty() {
        var result0;
        var pos0;
        
        pos0 = pos;
        result0 = [];
        return result0;
      }
      
      
      function cleanupExpected(expected) {
        expected.sort();
        
        var lastExpected = null;
        var cleanExpected = [];
        for (var i = 0; i < expected.length; i++) {
          if (expected[i] !== lastExpected) {
            cleanExpected.push(expected[i]);
            lastExpected = expected[i];
          }
        }
        return cleanExpected;
      }
      
      function computeErrorPosition() {
        /*
         * The first idea was to use |String.split| to break the input up to the
         * error position along newlines and derive the line and column from
         * there. However IE's |split| implementation is so broken that it was
         * enough to prevent it.
         */
        
        var line = 1;
        var column = 1;
        var seenCR = false;
        
        for (var i = 0; i < Math.max(pos, rightmostFailuresPos); i++) {
          var ch = input.charAt(i);
          if (ch === "\n") {
            if (!seenCR) { line++; }
            column = 1;
            seenCR = false;
          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
            line++;
            column = 1;
            seenCR = true;
          } else {
            column++;
            seenCR = false;
          }
        }
        
        return { line: line, column: column };
      }
      
      
      
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
      
      
      var result = parseFunctions[startRule]();
      
      /*
       * The parser is now in one of the following three states:
       *
       * 1. The parser successfully parsed the whole input.
       *
       *    - |result !== null|
       *    - |pos === input.length|
       *    - |rightmostFailuresExpected| may or may not contain something
       *
       * 2. The parser successfully parsed only a part of the input.
       *
       *    - |result !== null|
       *    - |pos < input.length|
       *    - |rightmostFailuresExpected| may or may not contain something
       *
       * 3. The parser did not successfully parse any part of the input.
       *
       *   - |result === null|
       *   - |pos === 0|
       *   - |rightmostFailuresExpected| contains at least one failure
       *
       * All code following this comment (including called functions) must
       * handle these states.
       */
      if (result === null || pos !== input.length) {
        var offset = Math.max(pos, rightmostFailuresPos);
        var found = offset < input.length ? input.charAt(offset) : null;
        var errorPosition = computeErrorPosition();
        
        throw new this.SyntaxError(
          cleanupExpected(rightmostFailuresExpected),
          found,
          offset,
          errorPosition.line,
          errorPosition.column
        );
      }
      
      return result;
    },
    
    /* Returns the parser source code. */
    toSource: function() { return this._source; }
  };
  
  /* Thrown when a parser encounters a syntax error. */
  
  result.SyntaxError = function(expected, found, offset, line, column) {
    function buildMessage(expected, found) {
      var expectedHumanized, foundHumanized;
      
      switch (expected.length) {
        case 0:
          expectedHumanized = "end of input";
          break;
        case 1:
          expectedHumanized = expected[0];
          break;
        default:
          expectedHumanized = expected.slice(0, expected.length - 1).join(", ")
            + " or "
            + expected[expected.length - 1];
      }
      
      foundHumanized = found ? quote(found) : "end of input";
      
      return "Expected " + expectedHumanized + " but " + foundHumanized + " found.";
    }
    
    this.name = "SyntaxError";
    this.expected = expected;
    this.found = found;
    this.message = buildMessage(expected, found);
    this.offset = offset;
    this.line = line;
    this.column = column;
  };
  
  result.SyntaxError.prototype = Error.prototype;
  
  return result;
})();

},{"./objects":5}],6:[function(require,module,exports){
var objects = require('./objects'),
    Pair = objects.Pair;

var environment = {};

function defineFunction(name, numArgs, jsFunc) {
    var func = function (args) {
        return jsFunc.apply(null, args);
    };
    func.numArgs = numArgs;
    environment[name] = func;
}

defineFunction('car', 1, function (x) {
    return x.car;
});
defineFunction('cdr', 1, function (x) {
    return x.cdr;
});
defineFunction('+', 2, function (x, y) {
    return x.add(y);
});
defineFunction('-', 2, function (x, y) {
    return x.sub(y);
});
defineFunction('*', 2, function (x, y) {
    return x.mul(y);
});
defineFunction('/', 2, function (x, y) {
    return x.div(y);
});
defineFunction('=', 2, function (x, y) {
    return x.eql(y);
});
defineFunction('<', 2, function (x, y) {
    return x.lt(y);
});
defineFunction('>', 2, function (x, y) {
    return x.gt(y);
});
defineFunction('display', 1, function (x) {
    console.log(x.display());
});

exports.get = function (sym) {
    var name = sym.name;
    if (Object.hasOwnProperty.call(environment, name)) {
        return environment[sym.name];
    }
    throw new Error('unbound variable: ' + name);
};

exports.set = function (sym, val) {
    environment[sym.name] = val;
};

exports.reset = function (sym, val) {
    var name = sym.name;
    if (Object.hasOwnProperty.call(environment, name)) {
        environment[name] = val;
    }
    throw new Error('symbol not defined: ' + name);
};

},{"./objects":5}],5:[function(require,module,exports){
module.exports = {
    Bool       : require('./bool'),
    ByteVector : require('./bytevector'),
    Char       : require('./char'),
    Complex    : require('./complex'),
    Nil        : require('./nil'),
    Pair       : require('./pair'),
    Real       : require('./real'),
    Str        : require('./str'),
    Symbol     : require('./symbol'),
    Vector     : require('./vector')
};

},{"./bool":7,"./bytevector":8,"./char":9,"./complex":10,"./nil":11,"./pair":12,"./real":13,"./str":14,"./symbol":15,"./vector":16}],7:[function(require,module,exports){
function Bool(value) {
    // if Bool.True and Bool.False are already defined,
    // then return the corresponding instance.
    if (value && Bool.True) {
        return Bool.True;
    } else if (!value && Bool.False) {
        return Bool.False;
    } else {
        this.value = value;
    }
}

Bool.True = new Bool(true);
Bool.False = new Bool(false);

Bool.prototype.type = 'bool';

Bool.prototype.toJSON = function () {
    return {
        type: this.type,
        value: this.value
    };
};

module.exports = Bool;

},{}],8:[function(require,module,exports){
function ByteVector(bytes) {
    this.bytes = bytes;
}

ByteVector.prototype.type = 'bytevector';

ByteVector.prototype.toJSON = function () {
    return {
        type: this.type,
        bytes: this.bytes
    };
};

module.exports = ByteVector;

},{}],9:[function(require,module,exports){
function Char(value) {
    this.value = value;
}

Char.prototype.type = 'char';

Char.prototype.toJSON = function () {
    return {
        type: this.type,
        value: this.value
    };
};

module.exports = Char;

},{}],10:[function(require,module,exports){
function Complex(real, imag) {
    this.real = real; this.imag = imag;
}

Complex.prototype.type = 'complex';

Complex.prototype.toJSON = function () {
    return {
        type: 'complex',
        real: this.real,
        imag: this.imag
    };
};

module.exports = Complex;

},{}],11:[function(require,module,exports){
var Nil = {};

Nil.type = 'nil';

Nil.length = function () {
    return 0;
};

Nil.toArray = function () {
    return [];
};

Nil.toJSON = function () {
    return {
        type: Nil.type
    };
};

module.exports = Nil;

},{}],14:[function(require,module,exports){
// Since `String` is a builtin type in ECMAScript, so we use `Str` instead.
function Str(value) {
    this.value = value;
}

Str.prototype.type = 'string';

Str.prototype.toJSON = function () {
    return {
        type: this.type,
        value: this.value
    };
};

Str.prototype.display = function () {
    return '"' + this.value + '"';
};

module.exports = Str;

},{}],15:[function(require,module,exports){
function Symbol(name) {
    // make sure that there is exactly one copy for each symbol
    if (Object.hasOwnProperty.call(Symbol.symbols, name)) {
        return Symbol.symbols[name];
    } else {
        this.name = name;
        Symbol.symbols[name] = this;
    }
}

Symbol.symbols = {}; // allocated symbols

Symbol.prototype.type = 'symbol';

Symbol.prototype.toJSON = function () {
    return {
        type: this.type,
        name: this.name
    };
};

module.exports = Symbol;

},{}],16:[function(require,module,exports){
function Vector(elements) {
    this.elements = elements;
}

Vector.prototype.type = 'vector';

Vector.prototype.toJSON = function () {
    return {
        type: this.type,
        elements: this.elements
    };
};

module.exports = Vector;

},{}],12:[function(require,module,exports){
var Nil = require('./nil');


/**
 * @class
 */
function Pair(car, cdr) {
    this.car = car;
    this.cdr = cdr;
}


/**
 * @static
 * @function
 * @param {Array} array
 * @return {Pair}
 */
Pair.makeList = function (array) {
    var list = Nil,
        i;
    for (i = array.length - 1; i >= 0; --i) {
        list = new Pair(array[i], list);
    }
    return list;
};


/**
 * @property {String} type
 */
Pair.prototype.type = 'pair';


/**
 * @function
 * @return {Array}
 */
Pair.prototype.toArray = function () {
    var array = [], pair = this;
    while (pair.type === 'pair') {
        array.push(pair.car);
        pair = pair.cdr;
    }
    if (pair !== Nil) {
        array.push(pair);
    }
    return array;
};


/**
 * Compute and return the length of the list (assuming it's a proper list).
 * @function
 * @return {Number}
 */
Pair.prototype.getLength = function () {
    var len = 0, pair = this;
    while (pair !== Nil) {
        len += 1;
        pair = pair.cdr;
    }
    return len;
};


/**
 * Convert the list to a proper list.
 * (x y . z) -> (x y z)
 * @function
 * @return {Pair}
 */
Pair.prototype.toProperList = function () {
    var pair = this,
        list = Nil;
    while (pair.type === 'pair') {
        list = new Pair(pair.car, list);
        pair = pair.cdr;
    }
    if (pair === Nil) {
        return list;
    } else {
        list = new Pair(pair, list);
        return list.reverse();
    }
};


/**
 * @function
 * @return {Number}
 */
Pair.prototype.getDotPosition = function () {
    var pos = 0,
        pair = this;
    while (pair.type === 'pair') {
        pos += 1;
        pair = pair.cdr;
    }
    if (pair === Nil) {
        return pos;
    } else {
        return -1;
    }
};


/**
 * Determine whether the pair is a proper list.
 * @function
 * @return {Boolean}
 */
Pair.prototype.isProperList = function () {
    var pair = this;
    while (pair.type === 'pair') {
        pair = pair.cdr;
    }
    return pair === Nil;
};


/**
 * Return the reversed list.
 * @function
 * @return {Pair}
 */
Pair.prototype.reverse = function () {
    var ret = Nil,
        pair = this;
    while (pair.type === 'pair') {
        ret = new Pair(pair.car, ret);
        pair = pair.cdr;
    }
    return ret;
};


/**
 * @function
 * @return {Object}
 */
Pair.prototype.toJSON = function () {
    return {
        type: this.type,
        car: this.car.toJSON(),
        cdr: this.cdr.toJSON()
    };
};


module.exports = Pair;

},{"./nil":11}],13:[function(require,module,exports){
var Bool = require('./bool');

function Real(value) {
    this.value = value;
}

Real.prototype.toJSON = function () {
    return {
        type: 'real',
        value: this.value
    };
};

Real.prototype.add = function (other) {
    return new Real(this.value + other.value);
};

Real.prototype.sub = function (other) {
    return new Real(this.value - other.value);
};

Real.prototype.mul = function (other) {
    return new Real(this.value * other.value);
};

Real.prototype.div = function (other) {
    return new Real(this.value / other.value);
};

Real.prototype.neg = function () {
    return new Real(-this.value);
};

Real.prototype.eql = function (other) {
    return new Bool(this.value === other.value);
};

Real.prototype.lt = function (other) {
    return new Bool(this.value < other.value);
};

Real.prototype.gt = function (other) {
    return new Bool(this.value > other.value);
};

Real.prototype.display = function () {
    if (this.value === Infinity) {
        return '+inf.0';
    }
    if (this.value === -Infinity) {
        return '-inf.0';
    }
    if (isNaN(this.value)) {
        return '+nan.0';
    }
    return String(this.value);
};

module.exports = Real;

},{"./bool":7}]},{},[1])(1)
});
;