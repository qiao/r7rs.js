var parse = require('./parser').parse,
    compile = require('./compiler').compile,
    execute = require('./interpreter').execute,
    objects = require('./objects');


function evaluate(source) {
    var exprs = parse(source),
        expr,
        env = [],
        i, len, result;

    for (i = 0, len = exprs.length; i < len; ++i) {
        expr = exprs[i];
        result = execute(compile(expr), env);
        env = result.env;
    }
    return result.acc;
}

module.exports = {
    parse: parse,
    compile: compile,
    execute: execute,
    objects: objects,
    evaluate: evaluate
};
