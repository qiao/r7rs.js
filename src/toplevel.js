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

defineFunction('+', function (x, y) {
    return x + y;
});
defineFunction('-', function (x, y) {
    return x - y;
});
defineFunction('*', function (x, y) {
    return x * y;
});
defineFunction('/', function (x, y) {
    return x / y;
});
defineFunction('=', function (x, y) {
    return x === y;
});
defineFunction('<', function (x, y) {
    return (x < y);
});
defineFunction('>', function (x, y) {
    return (x > y);
});
defineFunction('display', 1, function (x) {
    if ((typeof x) === 'number') {
        console.log(x);
        return;
    }
    console.log(x.display());
});

module.exports = environment;
