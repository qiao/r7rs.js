var parse = require('./parser').parse,
    compile = require('./compiler').compile,
    execute = require('./vm').execute,
    Environment = require('./environment'),
    objects = require('./objects');


function evaluate(source) {
    return execute(compile(parse(source)));
}

module.exports = {
    parse: parse,
    compile: compile,
    execute: execute,
    objects: objects,
    evaluate: evaluate,
    Environment: Environment
};
