var objects = require('./objects'),
    Pair = objects.Pair;

var environment = {};

function defineFunction(name, numArgs, jsFunc) {
    var func = function (args) {
        return jsFunc.apply(null, args);
    };
    func.numArgs = numArgs;
    environment[name] = func;
}

defineFunction('car', 1, function (x) {
    return x.car;
});
defineFunction('cdr', 1, function (x) {
    return x.cdr;
});
defineFunction('+', 2, function (x, y) {
    return x.add(y);
});
defineFunction('-', 2, function (x, y) {
    return x.sub(y);
});
defineFunction('*', 2, function (x, y) {
    return x.mul(y);
});
defineFunction('/', 2, function (x, y) {
    return x.div(y);
});
defineFunction('=', 2, function (x, y) {
    return x.eql(y);
});
defineFunction('<', 2, function (x, y) {
    return x.lt(y);
});
defineFunction('>', 2, function (x, y) {
    return x.gt(y);
});
defineFunction('display', 1, function (x) {
    console.log(x.display());
});

exports.get = function (sym) {
    var name = sym.name;
    if (Object.hasOwnProperty.call(environment, name)) {
        return environment[sym.name];
    }
    throw new Error('unbound variable: ' + name);
};

exports.set = function (sym, val) {
    environment[sym.name] = val;
};

exports.reset = function (sym, val) {
    var name = sym.name;
    if (Object.hasOwnProperty.call(environment, name)) {
        environment[name] = val;
    }
    throw new Error('symbol not defined: ' + name);
};
