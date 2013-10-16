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
    TopLevel     = require('./toplevel');

function execute(opcode) {
    var acc     = null,             // accumulator
        expr    = opcode,           // next expression to execute
        fp      = 0,                // frame pointer
        closure = [],               // closure
        stack   = new Array(1000),  // call stack
        sp      = 0;                // stack pointer

    function makeClosure(body, n, sp) {
        var i, closure = new Array(n + 1);
        closure[0] = body;
        for (i = 0; i < n; ++i) {
            closure[i + 1] = stack[sp - i - 1];
        }
        return closure;
    }

    function makeContinuation(sp) {
        return makeClosure(
            {
                type:'refer-local',
                n: 0,
                next: {
                    type: 'nuate',
                    stack: saveStack(sp),
                    next: {
                        type: 'return',
                        n: 0
                    }
                }
            },
            sp,
            sp
        );
    }

    function saveStack(sp) {
        return stack.slice(0, sp);
    }

    function restoreStack(savedStack) {
        var i, len;
        for (i = 0, len = savedStack.length; i < len; ++i) {
            stack[i] = savedStack[i];
        }
        return len;
    }

    function shiftArgs(n, m, sp) {
        var i;
        for (i = n - 1; i >= 0; --i) {
            stack[sp - i - m - 1] = stack[sp - i - 1];
        }
        return sp - m;
    }

    while (true) {
        //console.log(JSON.stringify(expr, null, 4));
        //console.log('acc:', acc);
        //console.log('stack:', stack.slice(0, sp));
        //console.log('clos:', JSON.stringify(closure, null, 4));
        //console.log('---------------------------------------');
        switch (expr.type) { // instruction
            case 'halt':
                return acc;
            case 'constant': // (obj next)
                acc = expr.obj;
                expr = expr.next;
                break;
            case 'box': // (n next)
                stack[sp - expr.n - 1] = [stack[sp - expr.n - 1]];
                expr = expr.next;
                break;
            case 'indirect': // (next)
                acc = acc[0]; // unbox
                expr = expr.next;
                break;
            case 'refer-local': // (n next)
                acc = stack[fp - expr.n - 1];
                expr = expr.next;
                break;
            case 'refer-free': // (n next)
                acc = closure[expr.n + 1];
                expr = expr.next;
                break;
            case 'refer-global': // (sym next)
                acc = TopLevel.get(expr.sym);
                expr = expr.next;
                break;
            case 'assign-local': // (n next)
                stack[fp - expr.n - 1][0] = acc;
                expr = expr.next;
                break;
            case 'assign-free': // (n next)
                closure[expr.n + 1][0] = acc;
                expr = expr.next;
                break;
            case 'assign-global': // (sym next)
                TopLevel.reset(expr.sym, acc);
                expr = expr.next;
                break;
            case 'test': // (then else)
                expr = (acc === Bool.False ? expr.elsec : expr.thenc);
                break;
            case 'close': // (n body next)
                acc = makeClosure(expr.body, expr.n, sp);
                sp -= expr.n;
                expr = expr.next;
                break;
            case 'conti': // (next)
                acc = makeContinuation(sp);
                expr = expr.next;
                break;
            case 'nuate': // (stack next)
                sp = restoreStack(expr.stack);
                expr = expr.next;
                break;
            case 'frame': // (ret next)
                stack[sp++] = closure;
                stack[sp++] = fp;
                stack[sp++] = expr.ret;
                expr = expr.next;
                break;
            case 'argument': // (next)
                stack[sp++] = acc;
                expr = expr.next;
                break;
            case 'shift': // (n m next)
                sp = shiftArgs(expr.n, expr.m, sp);
                expr = expr.next;
                break;
            case 'apply': // ()
                (function () {
                    var args = [], i;
                    if ((typeof acc) === 'function') {
                        for (i = 0; i < acc.numArgs; ++i) {
                            args.push(stack[sp - i - 1]);
                        }
                        sp -= acc.numArgs;
                        expr    = stack[sp - 1];
                        fp      = stack[sp - 2];
                        closure = stack[sp - 3];
                        sp -= 3;
                        acc = acc(args);
                    } else {
                        expr = acc[0];
                        fp = sp;
                        closure = acc;
                    }
                })();
                break;
            case 'return': // (n)
                sp -= expr.n;
                expr    = stack[sp - 1];
                fp      = stack[sp - 2];
                closure = stack[sp - 3];
                sp -= 3;
                break;
            default: // this should be an exception
                return acc;
        }
    }
}

exports.execute = execute;
