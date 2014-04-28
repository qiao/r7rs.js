var parse = require('./parser').parse,
    compile = require('./compiler').compile,
    execute = require('./interpreter').execute,
    objects = require('./objects');


function evaluate(source) {
    return execute(compile(parse(source)[0]));
}

module.exports = {
    parse: parse,
    compile: compile,
    execute: execute,
    objects: objects,
    evaluate: evaluate
};
