var objects = require('../objects');
var Pair    = objects.Pair;
var Symbol  = objects.Symbol;
var Nil     = objects.Nil;


/**
 * Compile the s-expression into intermediate form.
 *
 * ref:
 *   symbol: Symbol
 *
 * set:
 *   symbol: Symbol
 *   expr: IForm
 *
 * const:
 *   value: *
 *
 * if:
 *   test: IForm
 *   then: IForm
 *   else: IForm
 *
 * define:
 *   id: Symbol
 *   expr: IForm
 *
 * lambda:
 *   args: [Symbol]
 *   variadic: Bool,
 *   body: IForm
 *
 * call:
 *   proc: IForm
 *   args: [IForm]
 *
 * seq:
 *   body: [IForm]
 *   
 */
function compile(expr) {
  if (expr.type === 'symbol') {
    return {
      type: 'ref',
      symbol: expr
    };
  }

  if (expr.type === 'pair') {
    switch (expr.car.name) {
      case 'quote':
        return {
          type: 'const',
          value: expr.cdr.car
        };
      case 'define':
        return compileDefine(expr);
      case 'lambda':
        return compileLambda(expr);
      case 'set!':
        return {
          type: 'set',
          symbol: expr.cdr.car,
          expr: compile(expr.cdr.cdr.car)
        };
      case 'begin':
        return compileBegin(expr);
      case 'if':
        return {
          type: 'if',
          test: compile(expr.cdr.car),
          then: compile(expr.cdr.cdr.car),
          'else': compile(expr.cdr.cdr.cdr.car)
        };
      default: // call
        return compileCall(expr);
    }
  }

  return {
    type: 'const',
    value: expr
  };
}


function compileDefine(expr) {
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
  ]));
}

function compileLambda(expr) {
  // expr is like
  // (lambda (<formals>) <body>)
  // (lambda <formal> <body>)
  var args = expr.cdr.car;
  var body = compileBody(expr.cdr.cdr);

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

function compileBody(expr) {
  var body = [];
  for (; expr !== Nil; expr = expr.cdr) {
    body.push(compile(expr.car));
  }
  if (body.length > 1) {
    return {
      type: 'seq',
      body: body
    };
  } 
  return body[0];
}

function compileBegin(expr) {
  var body = [];
  for (expr = expr.cdr; expr !== Nil; expr = expr.cdr) {
    body.push(compile(expr.car));
  }
  if (body.length > 1) {
    return {
      type: 'seq',
      body: body
    };
  }
  return body[0];
}

function compileCall(expr) {
  var proc = compile(expr.car);

  var args = expr.cdr.toArray();
  for (var i = 0; i < args.length; ++i) {
    args[i] = compile(args[i]);
  }

  return {
    type: 'call',
    proc: proc,
    args: args
  };
}

exports.compile = function (exprs) {
  var body = [];
  for (var i = 0; i < exprs.length; ++i) {
    body.push(compile(exprs[i]));
  }

  return {
    type: 'seq',
    body: body
  };
};

