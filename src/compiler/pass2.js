
function compile(expr) {
    switch (expr.type) {
        case 'set':
            return {
                type: 'set',
                symbol: expr.symbol,
                expr: compile(expr.expr)
            };
        case 'if':
            return {
                type: 'if',
                test: compile(expr.test),
                then: compile(expr.then),
                'else': compile(expr.else)
            };
        case 'define':
            return {
                type: 'define',
                id: expr.id,
                expr: compile(expr.expr)
            };
        case 'lambda':
            return {
                type: 'lambda',
                args: expr.args,
                variadic: expr.variadic,
                body: compile(expr.body)
            };
        case 'call':
            return compileCall(expr);
        case 'seq':
            return compileSeq(expr);
    }

    return expr;
}


function compileSeq(expr) {
    var i, body;

    body = [];

    for (i = 0; i < expr.body.length; ++i) {
        body.push(compile(expr.body[i]));
    }

    return {
        type: 'seq',
        body: body
    };
}


function compileCall(expr) {
    var proc, args, name, i;

    proc = compile(expr.proc);
    args = compileArgs(expr.args);

    //if (proc.type === 'ref') {
        //name = proc.symbol.name;
        //switch (name) {
            //case '+': return { type: 'add', args: args };
            //case '-': return { type: 'sub', args: args };
        //}
    //}

    return {
        type: 'call',
        proc: proc,
        args: args
    };
}


function compileArgs(args) {
    var i, ret;

    ret = [];
    for (i = 0; i < args.length; ++i) {
        ret.push(compile(args[i]));
    }

    return ret;
}


exports.compile = function (expr) {
  var a = compile(expr);
  //console.log(JSON.stringify(a, null, 4));
  return a;
};
