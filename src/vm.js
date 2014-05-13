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
        stk = null,
        type;
        
    while (true) {
        type = exp.type;

        switch (type.length) {
        case 3: // type is 'arg'
            rib[exp.i] = acc;
            exp = exp.next;
            break;
        case 4:
            switch (type) {
            case 'lref':
                acc = env[exp.depth][exp.offset];
                exp = exp.next;
                break;
            case 'gref':
                if (exp.index === -1) {
                    exp.index = TopLevel.getIndex(exp.symbol);
                }
                acc = TopLevel.lookupByIndex(exp.index);
                exp = exp.next;
                break;
            case 'test':
                exp = acc === Bool.True ? exp.then : exp.else;
                break;
            case 'lset':
                env[exp.depth][exp.offset] = acc;
                exp = exp.next;
                break;
            case 'gset':
                if (exp.index === -1) {
                    exp.index = TopLevel.getIndex(exp.symbol);
                }
                TopLevel.set(exp.index, acc);
                exp = exp.next;
                break;
            case 'halt':
                return {
                    acc: acc,
                    env: env
                };
            }
            break;
        case 5:
            switch (type) {
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
            case 'frame':
                stk = {
                    ret: exp.ret,
                    env: env,
                    rib: rib,
                    stk: stk
                };
                rib = new Array(exp.numArgs);
                exp = exp.next;
                break;
            case 'const':
                acc = exp.object;
                exp = exp.next;
                break;
            case 'close':
                acc = new Closure(exp.body, env, exp.numArgs, exp.variadic);
                exp = exp.next;
                break;
            case 'conti':
                acc = new Closure({
                    type: 'nuate',
                    stk: stk
                }, [], 0, false);
                exp = exp.next;
                break;
            case 'nuate':
                acc = env[0][0];
                stk = exp.stk;
                exp = { type: 'return' };
            }
            break;
        case 6:
            switch (type) {
            case 'return':
                exp = stk.ret;
                env = stk.env;
                rib = stk.rib;
                stk = stk.stk;
                break;
            case 'define':
                TopLevel.define(exp.variable, acc);
                exp = exp.next;
                break;
            }
            break;
        }
    }
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
