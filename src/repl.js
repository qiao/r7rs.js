var readline = require('readline');

var compiler = require('./compiler');
var parser = require('./parser');
var vm = require('./vm');

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.setPrompt('> ');
rl.prompt();

rl.on('line', function (source) {
    try {
        var expr = parser.parse(source)[0];
        var opcode = compiler.compile(expr);
        var object = vm.execute(opcode);
        console.log(object.display());
    } catch (e) {
        //console.error('ERROR: ' + e.message);
        console.error(e.stack);
    }

    rl.prompt();
});
