var parse = require('./parser').parse;
var compile = require('./compiler').compile;
var execute = require('./vm').execute;
var Environment = require('./environment');
var objects = require('./objects');


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
