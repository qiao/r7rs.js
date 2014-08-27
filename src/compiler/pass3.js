// compile the intermediate form into CPS.

function compile(expr, env, next) {
  switch (expr.type) {
    case 'ref':
      return compileLookup('ref', expr.id, env, next);
    case 'set':
      return compile(expr.expr,
                     env,
                     compileLookup('set', expr.id, env, next));
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
    case 'void':
      return next;
  }
}


function compileLookup(type, sym, env, next) {
  for (var depth = 0; depth < env.length; ++depth) {
    var rib = env[depth];
    for (var offset = 0; offset < rib.length; ++offset) {
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
  var proc = expr.proc;
  var args = expr.args;

  var ret = compile(proc, env, { type: 'apply' });

  for (var i = args.length - 1; i >= 0; --i) {
    ret = compile(args[i], env, {
      type: 'arg',
      i: i,
      next: ret
    });
  }

  var isTail = next.type === 'return';
  return isTail ? ret : {
    type: 'frame',
    nargs: args.length,
    ret: next,
    next: ret
  };
}


function compileSeq(expr, env, next) {
  var body = expr.body;

  for (var i = body.length - 1; i >= 0; --i) {
    next = compile(body[i], env, next);
  }

  return next;
}


exports.compile = function (expr) {
  return compile(expr, [], { type: 'halt' });
};
