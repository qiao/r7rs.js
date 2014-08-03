var objects     = require('./objects');
var Pair        = objects.Pair;
var Bool        = objects.Bool;
var Nil         = objects.Nil;
var Symbol      = objects.Symbol;
var Environment = require('./environment');

var environment = new Environment();

function define(bindings) {
  var name, value;
  for (name in bindings) {
    value = bindings[name];
    value.type = '';
    environment.define(new Symbol(name), value);
  }
}

define({
  '+': function (args) {
    return args[0].add(args[1]);
  },
  '-': function (args) {
    return args[0].sub(args[1]);
  },
  '*': function (args) {
    return args[0].mul(args[1]);
  }, 
  '/': function (args) {
    return args[0].div(args[1]);
  },
  '=': function (args) {
    return args[0].eql(args[1]);
  },
  '<': function (args) {
    return args[0].lt(args[1]);
  },
  '>': function (args) {
    return args[0].gt(args[1]);
  },
  'display': function (args) {
    console.log(args[0].display());
  },
  'cons': function (args) {
    return new Pair(args[0], args[1]);
  },
  'car': function (args) {
    return args[0].car;
  },
  'cdr': function (args) {
    return args[0].cdr;
  },
  'null?': function (args) {
    return new Bool(args[0] === Nil);
  },
  'append': function (args) {
    if (args[0] === Nil) {
      return new Pair(args[1], Nil);
    }
    return args[0].append(args[1]);
  }
});

module.exports = environment;
