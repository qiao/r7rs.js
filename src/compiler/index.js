var passes = [
  require('./compileTreeIL'),
  require('./pass2'),
  require('./pass3')
];

exports.compile = function (expr) {
  for (var i = 0; i < passes.length; ++i) {
    expr = passes[i].compile(expr);
  }

  return expr;
};
