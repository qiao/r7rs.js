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


function execute(opcode) {
    var acc = null,
        exp = opcode,
        env = [],
        rib = [],
        stk = null,
        type;
        
    while (true) {
        type = exp.type;

        switch (type.length) {
        case 3: // arg
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
                    exp.index = TopLevel.getIndex(exp.id);
                }
                acc = TopLevel.lookupByIndex(exp.index);
                exp = exp.next;
                break;
            case 'test':
                // R7RS Section 6.3
                // Only #f counts as false in conditional expressions.
                // All other Scheme values, including #t, count as true.
                exp = acc === Bool.False ? exp.else : exp.then;
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
                return acc;
            }
            break;
        case 5:
            switch (type) {
            case 'apply':
                if (acc.type === 'closure') {
                    if (acc.isVariadic) {
                        fixRib(rib, acc.nargs);
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
                rib = new Array(exp.nargs);
                exp = exp.next;
                break;
            case 'const':
                acc = exp.value;
                exp = exp.next;
                break;
            case 'close':
                acc = new Closure(exp.body, env, exp.nargs, exp.variadic);
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
                TopLevel.define(exp.id, acc);
                exp = exp.next;
                break;
            }
            break;
        }
    }
}

function fixRib(rib, nargs) {
    var rest = Nil,
        nrest = rib.length - nargs + 1,
        i;

    for (i = 0; i < nrest; ++i) {
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

exports.execute = execute;
