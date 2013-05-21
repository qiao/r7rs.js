/* global CodeMirror: true, r7rs: true */

var sourceEditor = CodeMirror.fromTextArea($('#code')[0], {
  mode: 'scheme',
  lineNumbers: true,
  lineWrapping: true,
  matchBrackets: true,
  autoCloseBrackets: true
});

var astEditor = CodeMirror.fromTextArea($('#ast')[0], {
  mode: 'javascript',
  matchBrackets: true,
  lineNumbers: true,
  lineWrapping: true,
  readOnly: true
});

var opcodeEditor = CodeMirror.fromTextArea($('#opcode')[0], {
  mode: 'javascript',
  matchBrackets: true,
  lineNumbers: true,
  lineWrapping: true,
  readOnly: true
});

var outputEditor = CodeMirror.fromTextArea($('#output')[0], {
  mode: 'scheme',
  matchBrackets: true,
  lineNumbers: true,
  lineWrapping: true,
  readOnly: true
});

var $parse = $('#parse');
var $ast = $('#ast');
var $compile = $('#compile');
var $opcode = $('#opcode');
var $execute = $('#execute');

var source;
var ast;
var opcode;
var output;

$parse.click(function () {
  source = sourceEditor.getValue();
  ast = r7rs.parse(source)[0];
  astEditor.setValue(JSON.stringify(ast, null, 4));
  opcodeEditor.setValue('');
  outputEditor.setValue('');
});

$compile.click(function () {
  opcode = r7rs.compile(ast);
  opcodeEditor.setValue(JSON.stringify(opcode, null, 4));
});

$execute.click(function () {
  output = r7rs.execute(opcode);
  outputEditor.setValue(output.display());
});
