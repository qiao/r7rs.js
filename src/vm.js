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
    Vector       = objects.Vector,
    Closure      = objects.Closure,
    TopLevel     = require('./toplevel');


function execute(opcode, env) {
    var acc = null,
        exp = opcode,
        env = env,
        rib = [],
        stk = null;
        
    while (true) {
        switch (exp.type) {
            case 'halt':
                return {
                    acc: acc,
                    env: env
                };
            case 'constant':
                acc = exp.object;
                exp = exp.next;
                break;
            case 'refer':
                if (exp.location.type === 'index') {
                    acc = env[exp.location.index[0]][exp.location.index[1]];
                } else {
                    if (exp.location.index === -1) {
                        exp.location.index = TopLevel.getIndex(exp.location.symbol);
                    }
                    acc = TopLevel.lookupByIndex(exp.location.index);
                }
                exp = exp.next;
                break;
            case 'define':
                TopLevel.define(exp.variable, acc);
                exp = exp.next;
                break;
            case 'close':
                acc = new Closure(exp.body, env, exp.numArgs, exp.variadic);
                exp = exp.next;
                break;
            case 'test':
                exp = acc === Bool.True ? exp.then : exp.else;
                break;
            case 'assign':
                if (exp.location.type === 'index') {
                    env[exp.location.index[0]][exp.location.index[1]] = acc;
                } else {
                    if (exp.location.index === -1) {
                        exp.location.index = TopLevel.getIndex(exp.location.symbol);
                    }
                    TopLevel.set(exp.location.index, acc);
                }
                exp = exp.next;
                break;
            case 'conti':
                acc = makeContinuation(stk);
                exp = exp.next;
                break;
            case 'nuate':
                acc = env[0][0];
                stk = exp.stk;
                exp = { type: 'return' };
                break;
            case 'frame':
                stk = makeCallFrame(exp.ret, env, rib, stk);
                rib = new Array(exp.numArgs);
                exp = exp.next;
                break;
            case 'argument':
                rib[exp.i] = acc;
                exp = exp.next;
                break;
            case 'apply':
                if (acc.type === 'closure') {
                    if (acc.isVariadic) {
                        fixRib(rib, acc.numArgs);
                    }
                    env = [rib].concat(acc.env);
                    rib = [];
                    exp = acc.body;
                } else {
                    acc = acc(rib);
                    exp = { type: 'return' };
                }
                break;
            case 'return':
                exp = stk.ret;
                env = stk.env;
                rib = stk.rib;
                stk = stk.stk;
                break;
        }
    }
}

function makeContinuation(stk) {
    return new Closure({
        type: 'nuate',
        stk: stk
    }, [], 0, false);
}

function makeCallFrame(ret, env, rib, stk) {
    return {
        ret: ret,
        env: env,
        rib: rib,
        stk: stk
    };
}

function fixRib(rib, numArgs) {
    var rest = Nil,
        numRest = rib.length - numArgs + 1,
        i;

    for (i = 0; i < numRest; ++i) {
        rest = new Pair(rib.pop(), rest);
    }
    rib.push(rest);
}

function logOpcode(opcode) {
    //var opcode = JSON.parse(JSON.stringify(opcode));
    //delete opcode.next;
    //console.log(opcode);
    console.log(JSON.stringify(opcode, null, 4));
}

exports.execute = function (opcodes) {
    var i, len, result, env = [];

    for (i = 0, len = opcodes.length; i < len; ++i) {
        result = execute(opcodes[i], env);
        env = result.env;
    }

    return result.acc;
};
