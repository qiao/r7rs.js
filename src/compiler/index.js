var passes = [
    require('./pass1'),
    require('./pass2'),
    require('./pass3')
];

exports.compile = function (expr) {
    var i;

    for (i = 0; i < passes.length; ++i) {
        expr = passes[i].compile(expr);
    }

    return expr;
};
