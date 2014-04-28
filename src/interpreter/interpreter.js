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
                //console.log(acc);
                return acc;
            case 'constant':
                acc = exp.object;
                exp = exp.next;
                break;
            case 'refer':
                if (exp.location.type === 'index') {
                    acc = env[exp.location.index[0]][exp.location.index[1]];
                } else {
                    acc = TopLevel.get(exp.location.symbol);
                }
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
                if (exp.location.type === 'index') {
                    env[exp.location.index[0]][exp.location.index[1]] = acc;
                } else {
                    TopLevel.set(exp.location.symbol, acc);
                }
                exp = exp.next;
                break;
            case 'conti':
                acc = makeContinuation(stk);
                exp = exp.next;
                break;
            case 'nuate':
                if (exp.location.type === 'index') {
                    acc = env[exp.location.index[0]][exp.location.index[1]];
                } else {
                    acc = TopLevel.get(exp.location.symbol);
                }
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
                if ((typeof acc) === 'function') {
                    acc = acc(rib);
                    rib = [];
                    exp = { type: 'return' };
                } else {
                    env = [rib].concat(acc.env);
                    rib = [];
                    exp = acc.body;
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
        location: {
            type: 'index',
            index: [0, 0]
        }
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
