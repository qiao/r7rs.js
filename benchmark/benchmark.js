var fs = require('fs');
var path = require('path');
var colors = require('colors');
var now = require('performance-now');
var r7rs = require('../');

function timer(samples, procedure) {
    var start, end, i;

    start = now();
    for (i = 0; i < samples; ++i) {
      procedure();
    }
    end = now();

    return ((end - start) / samples).toFixed(1);
}

function benchmark(filename) {
    process.stdout.write(path.basename(filename) + '\t...');

    var source = fs.readFileSync(filename).toString();
    var time = timer(5, function () {
        r7rs.evaluate(source);
    });

    process.stdout.write('\b\b\b' + (time + 'ms').green + '\n');
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
