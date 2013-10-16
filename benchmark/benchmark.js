var fs = require('fs');
var path = require('path');
var colors = require('colors');
var r7rs = require('../');

function benchmark(filename) {
  process.stdout.write(path.basename(filename) + '\t...');
  var start = Date.now();
  var source = fs.readFileSync(filename).toString();
  var expr = r7rs.parse(source)[0];
  var opcode = r7rs.compile(expr);
  var object = r7rs.execute(opcode);
  var end = Date.now();
  process.stdout.write('\b\b\b' + (end - start + 'ms').green + '\n');
}

function getBenchmarkFiles() {
  var currentPath = path.resolve(__dirname);
  var files = fs.readdirSync(currentPath);

  return files.map(function (filename) {
    return path.join(currentPath, filename);
  }).filter(function (filename) {
    return path.extname(filename) === '.scm';
  });
}

getBenchmarkFiles().forEach(benchmark);
