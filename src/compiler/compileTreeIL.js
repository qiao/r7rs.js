/**
 * @fileoverview This pass compiles the s-expression into the 
 *   tree intermediate form, which is composed of the following nodes:
 *
 *   ref:
 *     id: Symbol
 *
 *   set:
 *     id: Symbol
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
 *     variadic: Boolean
 *     body: IForm
 *
 *   call:
 *     proc: IForm
 *     args: [IForm]
 *
 *   seq:
 *     body: [IForm]
 *
 *   let:
 *     ids: [Symbol]
 *     values: [IForm]
 *     body: IForm
 *
 *   letrec:
 *     sequential: Boolean
 *     ids: [Symbol]
 *     values: [IForm]
 *     body: IForm
 *
 *   void:
 *     
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
      id: expr
    };
  }

  if (expr.type !== 'pair') {
    return {
      type: 'const',
      value: expr
    };
  }

  // now expr is a pair, which has the form: (head args*)
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
        id: expr.cdr.car,
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
    case 'let':
      return compileLet(expr, env);
    case 'letrec':
      return compileLetrec(expr, env);
    default:
      throw new Error('should not reach here');
  }
}


function compileDefine(expr, env) {
  expr = normalizeDefine(expr);

  return {
    type: 'define',
    id: expr.cdr.car,
    expr: compile(expr.cdr.cdr.car, env)
  };
}

function compileLambda(expr, env) {
  // expr is like
  // (lambda (<formals>) <body>)
  // (lambda <formal> <body>)
  var args = expr.cdr.car;
  
  // define the formals in the environment
  var newEnv = new Environment(env);
  for (var i = 0, len = args.length; i < len; ++i) {
    newEnv.define(args[i], args[i]);
  }

  var body = compileBody(expr.cdr.cdr, newEnv);

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

function normalizeDefine(expr) {
  // R7RS Section 5.3
  // (define <id> <expression>)
  // (define (<id> <formals>) <body>)
  //   => (define <id>
  //        (lambda (<formals>) <body>))
  // (define (<id> . <formal>) <body>)
  //   => (define <id>
  //        (lambda <formal> <body>))
  var second = expr.cdr.car;
  if (second.type === 'symbol') {
    return expr;
  }

  // second.type === 'pair'
  var id = second.car;
  var formals = second.cdr;
  var body = expr.cdr.cdr;
  var lambda = new Pair(new Symbol('lambda'),
                        new Pair(formals,
                                 body));
  return Pair.makeList([
    new Symbol('define'),
    id,
    lambda
  ]);
}

//function transformInternalDefinitions(exprs, env) {
  //var bindings = [];

  //for (; exprs !== Nil; exprs = exprs.cdr) {
    //var expr = exprs.car;
    //var head = env.lookupBySymbol(expr.car);

    //// check for internal definitions
    //if (head && head.type === 'syntax' && head.name === 'define') {
      //var define = normalizeDefine(expr);
      //var id = define.cdr.car;
      //var value = define.cdr.cdr.car;
      //bindings.push(Pair.makeList([id, value]));
    //} else {
      //break;
    //}
  //}

  
  //return Pair.makeList([
    //new Symbol('letrec*'),
    //Pair.makeList(bindings),
    //exprs
  //]);
//}

function compileBody(exprs, env) {
  var body = [];

  for (; exprs !== Nil; exprs = exprs.cdr) {
    body.push(compile(exprs.car, env));
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

function compileLet(expr, env) {
  // (let ((<id> <value>)
  //       (<id> <value>))
  //   <body>)
  var bindings = expr.cdr.car.toArray();
  var ids = [];
  var values = [];
  var newEnv = new Environment(env);

  for (var i = 0, len = bindings.length; i < len; ++i) {
    var binding = bindings[i];
    var id = binding.car;
    var value = binding.cdr.car;

    ids.push(id);
    values.push(compile(value, env));
  
    newEnv.define(id, id);
  }

  return {
    type: 'let',
    ids: ids,
    values: values,
    body: compileBody(expr.cdr.cdr, newEnv)
  };
}

function compileLetrec(expr, env) {
  // (letrec ((<id> <value>)
  //          (<id> <value>))
  //   <body>)
  var bindings = expr.cdr.car.toArray();
  var ids = [];
  var values = [];
  var newEnv = new Environment(env);

  for (var i = 0, len = bindings.length; i < len; ++i) {
    var binding = bindings[i];
    var id = binding.car;
    ids.push(id);
    newEnv.define(id, id);
  }

  for (i = 0, len = bindings.length; i < len; ++i) {
    var binding = bindings[i];
    var value = binding.cdr.car;
    values.push(compile(value, newEnv));
  }

  return {
    type: 'letrec',
    sequential: false,
    ids: ids,
    values: values,
    body: compileBody(expr.cdr.cdr, newEnv)
  };
}


/**
 * The main entry point of the compilation.
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
  env.define(new Symbol('let')    , new Syntax('let'));
  env.define(new Symbol('letrec') , new Syntax('letrec'));

  var body = [];
  for (var i = 0; i < exprs.length; ++i) {
    body.push(compile(exprs[i], env));
  }
  console.log(JSON.stringify(body, null, 4));

  switch (body.length) {
    case 0:
      return { type: 'void' };
    case 1:
      return body[0];
    default:
      return { type: 'seq', body: body };
  }
};

