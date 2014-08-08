/**
 * @fileoverview This pass compile the s-expression into the 
 *   tree intermediate form, which is composed of the following nodes:
 *
 *   ref:
 *     symbol: Symbol
 *
 *   set:
 *     symbol: Symbol
 *     expr: IForm
 *
 *   const:
 *     value: *
 *
 *   if:
 *     test: IForm
 *     then: IForm
 *     else: IForm
 *
 *   define:
 *     id: Symbol
 *     expr: IForm
 *
 *   lambda:
 *     args: [Symbol]
 *     variadic: Bool
 *     body: IForm
 *
 *   call:
 *     proc: IForm
 *     args: [IForm]
 *
 *   seq:
 *     body: [IForm]
 *     
 *   During this pass, several transformations are performed, including:
 *
 *     1. transform (define (f x) ...) into (define f (lambda (x) ...))
 */

var objects     = require('../objects');
var Pair        = objects.Pair;
var Symbol      = objects.Symbol;
var Syntax      = objects.Syntax;
var Nil         = objects.Nil;
var Environment = require('../environment');


/**
 * @param {Object} expr
 * @param {Environment} env
 * @return {Object}
 */
function compile(expr, env) {
  if (expr.type === 'symbol') {
    return {
      type: 'ref',
      symbol: expr
    };
  }

  if (expr.type !== 'pair') {
    return {
      type: 'const',
      value: expr
    };
  }

  // now expr is a pair, which has the following form
  // (head args*)
  var head = expr.car;
  var operator = env.lookupBySymbol(head);

  if (operator === null || operator.type !== 'syntax') {
    return compileCall(expr, env);
  }

  // operator is a builtin syntax
  switch (operator.name) {
    case 'quote':
      return {
        type: 'const',
        value: expr.cdr.car
      };
    case 'define':
      return compileDefine(expr, env);
    case 'lambda':
      return compileLambda(expr, env);
    case 'set!':
      return {
        type: 'set',
        symbol: expr.cdr.car,
        expr: compile(expr.cdr.cdr.car, env)
      };
    case 'begin':
      return compileBegin(expr, env);
    case 'if':
      return {
        type: 'if',
        test: compile(expr.cdr.car, env),
        then: compile(expr.cdr.cdr.car, env),
        'else': compile(expr.cdr.cdr.cdr.car, env)
      };
    default:
      throw new Error('should not reach here');
  }
}


function compileDefine(expr, env) {
  // R7RS Section 5.3
  // (define <variable> <expression>)
  // (define (<variable> <formals>) <body>)
  //   => (define <variable>
  //        (lambda (<formals>) <body>))
  // (define (<variable> . <formal>) <body>)
  //   => (define <variable>
  //        (lambda <formal> <body>))
  var second = expr.cdr.car;
  if (second.type === 'symbol') {
    return {
      type: 'define',
      id: second,
      expr: compile(expr.cdr.cdr.car)
    };
  }

  // second.type === 'pair'
  var id = second.car;
  var formals = second.cdr;
  var body = expr.cdr.cdr;
  var lambda = new Pair(new Symbol('lambda'),
                        new Pair(formals,
                                 body));

  return compileDefine(Pair.makeList([
    new Symbol('define'),
    id,
    lambda
  ]), env);
}

function compileLambda(expr, env) {
  // expr is like
  // (lambda (<formals>) <body>)
  // (lambda <formal> <body>)
  var args = expr.cdr.car;
  var body = compileBody(expr.cdr.cdr, env);

  if (args.type === 'symbol') {
    return {
      type: 'lambda',
      args: [args],
      variadic: true,
      body: body
    };
  }

  // args.type is 'pair'
  return {
    type: 'lambda',
    args: args.toArray(),
    variadic: !args.isProperList(),
    body: body
  };
}

function compileBody(expr, env) {
  var body = [];
  for (; expr !== Nil; expr = expr.cdr) {
    body.push(compile(expr.car, env));
  }
  if (body.length > 1) {
    return {
      type: 'seq',
      body: body
    };
  } 
  return body[0];
}

function compileBegin(expr, env) {
  var body = [];
  for (expr = expr.cdr; expr !== Nil; expr = expr.cdr) {
    body.push(compile(expr.car, env));
  }
  if (body.length > 1) {
    return {
      type: 'seq',
      body: body
    };
  }
  return body[0];
}

function compileCall(expr, env) {
  var proc = compile(expr.car, env);

  var args = expr.cdr.toArray();
  for (var i = 0; i < args.length; ++i) {
    args[i] = compile(args[i], env);
  }

  return {
    type: 'call',
    proc: proc,
    args: args
  };
}

/**
 * The main entry point of compilation.
 * @param {Array.<Object>} exprs An array of s-expressions
 * @return {Object} The tree intermediate form
 */
exports.compile = function (exprs) {
  var env = new Environment();
  env.define(new Symbol('quote')  , new Syntax('quote'));
  env.define(new Symbol('define') , new Syntax('define'));
  env.define(new Symbol('if')     , new Syntax('if'));
  env.define(new Symbol('lambda') , new Syntax('lambda'));
  env.define(new Symbol('set!')   , new Syntax('set!'));
  env.define(new Symbol('begin')  , new Syntax('begin'));

  var body = [];
  for (var i = 0; i < exprs.length; ++i) {
    body.push(compile(exprs[i], env));
  }

  return {
    type: 'seq',
    body: body
  };
};

