var objects = require('./objects'),
    Pair = objects.Pair,
    Bool = objects.Bool,
    Nil = objects.Nil,
    Symbol = objects.Symbol,
    Environment = require('./environment');

var environment = new Environment();

function defineFunction(name, jsFunc) {
    var func = function (args) {
        return jsFunc.apply(null, args);
    };
    environment.define(new Symbol(name), func);
}

defineFunction('car', function (x) {
    return x.car;
});
defineFunction('cdr', function (x) {
    return x.cdr;
});
defineFunction('+', function (x, y) {
    return x.add(y);
});
defineFunction('-', function (x, y) {
    return x.sub(y);
});
defineFunction('*', function (x, y) {
    return x.mul(y);
});
defineFunction('/', function (x, y) {
    return x.div(y);
});
defineFunction('=', function (x, y) {
    return x.eql(y);
});
defineFunction('<', function (x, y) {
    return x.lt(y);
});
defineFunction('>', function (x, y) {
    return x.gt(y);
});
defineFunction('display', function (x) {
    console.log(x.display());
});
defineFunction('null?', function (list) {
    return new Bool(list === Nil);
});
defineFunction('cons', function (x, y) {
    return new Pair(x, y);
});
defineFunction('append', function (xs, x) {
    if (xs === Nil) {
        return new Pair(x, Nil);
    }
    return xs.append(x);
});

module.exports = environment;
