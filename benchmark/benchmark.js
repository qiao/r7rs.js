var fs = require('fs');
var path = require('path');
var colors = require('colors');
var r7rs = require('../');

function timer(samples, procedure) {
    var start, end, i;

    start = Date.now();
    for (i = 0; i < samples; ++i) {
      procedure();
    }
    end = Date.now();

    return (end - start) / samples;
}

function benchmark(filename) {
    process.stdout.write(path.basename(filename) + '\t...');

    var time = timer(5, function () {
        var source = fs.readFileSync(filename).toString();
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
