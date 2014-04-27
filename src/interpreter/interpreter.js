var objects      = require('../objects'),
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
    TopLevel     = require('../toplevel');


function execute(opcode) {
    var acc = null,
        exp = opcode,
        env = [],
        rib = [],
        stk = null;
        
    while (true) {
        switch (exp.type) {
            case 'halt':
                console.log(acc);
                return acc;
            case 'constant':
                acc = exp.object;
                exp = exp.next;
                break;
            case 'refer':
                acc = env[exp.location[0]][exp.location[1]];
                exp = exp.next;
                break;
            case 'close':
                acc = makeClosure(exp.body, env);
                exp = exp.next;
                break;
            case 'test':
                exp = acc === Bool.True ? exp.then : exp.else;
                break;
            case 'assign':
                env[exp.location[0]][exp.location[1]] = acc;
                exp = exp.next;
                break;
            case 'conti':
                acc = makeContinuation(stk);
                exp = exp.next;
                break;
            case 'nuate':
                acc = env[exp.location[0]][exp.location[1]];
                stk = exp.stk;
                exp = { type: 'return' };
                break;
            case 'frame':
                stk = makeCallFrame(exp.ret, env, rib, stk);
                rib = [];
                exp = exp.next;
                break;
            case 'argument':
                rib.unshift(acc);
                exp = exp.next;
                break;
            case 'apply':
                // acc is now a closure
                env = [rib].concat(acc.env);
                rib = [];
                exp = acc.body;
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

function makeClosure(body, env) {
    return {
        body: body,
        env: env
    };
}

function makeContinuation(stk) {
    return makeClosure({
        type: 'nuate',
        stk: stk,
        location: [0, 0]
    }, []);
}

function makeCallFrame(ret, env, rib, stk) {
    return {
        ret: ret,
        env: env,
        rib: rib,
        stk: stk
    };
}

function logOpcode(opcode) {
    //var opcode = JSON.parse(JSON.stringify(opcode));
    //delete opcode.next;
    //console.log(opcode);
    console.log(JSON.stringify(opcode, null, 4));
}

exports.execute = execute;
