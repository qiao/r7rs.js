(function(e){if("function"==typeof bootstrap)bootstrap("r7rs",e);else if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else if("undefined"!=typeof ses){if(!ses.ok())return;ses.makeR7rs=e}else"undefined"!=typeof window?window.r7rs=e():global.r7rs=e()})(function(){var define,ses,bootstrap,module,exports;
return (function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
var parse = require('./parser').parse;
var compile = require('./compiler').compile;
var execute = require('./vm').execute;
var Environment = require('./environment');
var objects = require('./objects');


function evaluate(source) {
  return execute(compile(parse(source)));
}

module.exports = {
  parse: parse,
  compile: compile,
  execute: execute,
  objects: objects,
  evaluate: evaluate,
  Environment: Environment
};

},{"./parser":2,"./vm":3,"./compiler":4,"./environment":5,"./objects":6}],5:[function(require,module,exports){
function Environment(parent) {
  /**
   * A map from symbol name to its index
   * @private
   */
  this._indices = {};

  /**
   * An array containing the values of the defined symbols in the environemnt
   * @private
   */
  this._values = [];

  /**
   * Parent environment.
   * @private
   */
  this._parent = parent;
}


/**
 * Create a symbol-value binding in the environment.
 * @param {Symbol} symbol
 * @param {*} value
 */
Environment.prototype.define = function (symbol, value) {
  this._store(symbol, value);
};


/**
 * Get the index of the symbol in the environment.
 * The index can later be used for accessing the bound
 * value of the symbol in a quicker manner.
 * @public
 * @method
 * @param {Symbol} symbol
 * @return {Number} The index of the symbol, -1 if the symbol is undefined
 */
Environment.prototype.getIndex = function (symbol) {
  var i = this._indices[symbol.name];
  if (i !== undefined) {
    return i;
  }

  if (!this._parent) {
    return -1;
  }

  var value = this._parent.lookupBySymbol(symbol);
  if (value === null) {
    return -1;
  }

  return this._store(symbol, value);
};


Environment.prototype._store = function (symbol, value) {
  this._indices[symbol.name] = this._values.length;
  this._values.push(value);
  return this._values.length - 1;
};


/**
 * Look up the bound value of the symbol in the environment.
 * @param {Symbol} symbol
 * @return {*} The bound value, null if the symbol is undefined
 */
Environment.prototype.lookupBySymbol = function (symbol) {
  var index = this.getIndex(symbol);
  if (index === -1) {
    return null;
  }
  return this._values[index];
};


/**
 * Look up the bound value at the given index;
 * @param {Number} index
 * @return {*} The bound value
 */
Environment.prototype.lookupByIndex = function (index) {
  return this._values[index];
};

module.exports = Environment;

},{}],3:[function(require,module,exports){
var objects      = require('./objects');
var Bool         = objects.Bool;
var ByteVector   = objects.ByteVector;
var Char         = objects.Char;
var Complex      = objects.Complex;
var Nil          = objects.Nil;
var Pair         = objects.Pair;
var Real         = objects.Real;
var Str          = objects.Str;
var Symbol       = objects.Symbol;
var Vector       = objects.Vector;
var Closure      = objects.Closure;
var TopLevel     = require('./toplevel');


function execute(opcode) {
  var acc = null;
  var exp = opcode;
  var env = [];
  var rib = [];
  var stk = null;

  while (true) {
    var type = exp.type;

    switch (type.length) {
      case 3: // arg
        rib[exp.i] = acc;
        exp = exp.next;
        break;
      case 4:
        switch (type) {
          case 'lref':
            acc = env[exp.depth][exp.offset];
            exp = exp.next;
            break;
          case 'gref':
            if (exp.index === -1) {
              exp.index = TopLevel.getIndex(exp.id);
            }
            acc = TopLevel.lookupByIndex(exp.index);
            exp = exp.next;
            break;
          case 'test':
            // R7RS Section 6.3
            // Only #f counts as false in conditional expressions.
            // All other Scheme values, including #t, count as true.
            exp = acc === Bool.False ? exp.else : exp.then;
            break;
          case 'lset':
            env[exp.depth][exp.offset] = acc;
            exp = exp.next;
            break;
          case 'gset':
            if (exp.index === -1) {
              exp.index = TopLevel.getIndex(exp.id);
            }
            TopLevel.set(exp.index, acc);
            exp = exp.next;
            break;
          case 'halt':
            return acc;
        }
        break;
      case 5:
        switch (type) {
          case 'apply':
            if (acc.type === 'closure') {
              if (acc.isVariadic) {
                fixRib(rib, acc.nargs);
              }
              env = [rib].concat(acc.env);
              rib = [];
              exp = acc.body;
            } else {
              acc = acc(rib);
              exp = { type: 'return' };
            }
            break;
          case 'frame':
            stk = {
              ret: exp.ret,
              env: env,
              rib: rib,
              stk: stk
            };
            rib = new Array(exp.nargs);
            exp = exp.next;
            break;
        case 'const':
          acc = exp.value;
          exp = exp.next;
          break;
        case 'close':
          acc = new Closure(exp.body, env, exp.nargs, exp.variadic);
          exp = exp.next;
          break;
        case 'conti':
          acc = new Closure({
            type: 'nuate',
            stk: stk
          }, [], 0, false);
          exp = exp.next;
          break;
        case 'nuate':
          acc = env[0][0];
          stk = exp.stk;
          exp = { type: 'return' };
        }
        break;
      case 6:
        switch (type) {
          case 'return':
            exp = stk.ret;
            env = stk.env;
            rib = stk.rib;
            stk = stk.stk;
            break;
          case 'define':
            TopLevel.define(exp.id, acc);
            exp = exp.next;
            break;
        }
        break;
    }
  }
}

function fixRib(rib, nargs) {
  var rest = Nil;
  var nrest = rib.length - nargs + 1;

  for (var i = 0; i < nrest; ++i) {
    rest = new Pair(rib.pop(), rest);
  }
  rib.push(rest);
}

function logOpcode(opcode) {
  //var opcode = JSON.parse(JSON.stringify(opcode));
  //delete opcode.next;
  //console.log(opcode);
  console.log(JSON.stringify(opcode, null, 4));
}

exports.execute = execute;

},{"./toplevel":7,"./objects":6}],4:[function(require,module,exports){
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

},{"./compileTreeIL":8,"./pass2":9,"./pass3":10}],6:[function(require,module,exports){
module.exports = {
  Bool       : require('./bool'),
  ByteVector : require('./bytevector'),
  Char       : require('./char'),
  Complex    : require('./complex'),
  Nil        : require('./nil'),
  Pair       : require('./pair'),
  Real       : require('./real'),
  Str        : require('./str'),
  Symbol     : require('./symbol'),
  Vector     : require('./vector'),
  Closure    : require('./closure'),
  Syntax     : require('./syntax')
};

},{"./bool":11,"./bytevector":12,"./char":13,"./complex":14,"./nil":15,"./pair":16,"./real":17,"./symbol":18,"./str":19,"./vector":20,"./closure":21,"./syntax":22}],2:[function(require,module,exports){
module.exports = (function() {
  /*
   * Generated by PEG.js 0.8.0.
   *
   * http://pegjs.majda.cz/
   */

  function peg$subclass(child, parent) {
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
  }

  function SyntaxError(message, expected, found, offset, line, column) {
    this.message  = message;
    this.expected = expected;
    this.found    = found;
    this.offset   = offset;
    this.line     = line;
    this.column   = column;

    this.name     = "SyntaxError";
  }

  peg$subclass(SyntaxError, Error);

  function parse(input) {
    var options = arguments.length > 1 ? arguments[1] : {},

        peg$FAILED = {},

        peg$startRuleFunctions = { start: peg$parsestart },
        peg$startRuleFunction  = peg$parsestart,

        peg$c0 = peg$FAILED,
        peg$c1 = [],
        peg$c2 = function(ds) { return ds; },
        peg$c3 = { type: "other", description: "datum" },
        peg$c4 = function(d) { return d; },
        peg$c5 = "=",
        peg$c6 = { type: "literal", value: "=", description: "\"=\"" },
        peg$c7 = "#",
        peg$c8 = { type: "literal", value: "#", description: "\"#\"" },
        peg$c9 = function(id) { return new Symbol(id); },
        peg$c10 = "(",
        peg$c11 = { type: "literal", value: "(", description: "\"(\"" },
        peg$c12 = ")",
        peg$c13 = { type: "literal", value: ")", description: "\")\"" },
        peg$c14 = function(ds) {
            return Pair.makeList(ds);
          },
        peg$c15 = ".",
        peg$c16 = { type: "literal", value: ".", description: "\".\"" },
        peg$c17 = function(ds, d) {
              var i, len = ds.length, pair = new Pair(ds[len - 1], d);
              for (i = len - 2; i >= 0; --i) {
                pair = new Pair(ds[i], pair);
              }
              return pair;
            },
        peg$c18 = function(a) { return a; },
        peg$c19 = function(a, d) {
              var symbol;
              switch (a) {
                case ',@': symbol = new Symbol('unquote-splicing'); break;
                case ',':  symbol = new Symbol('unquote'); break;
                case '\'': symbol = new Symbol('quote'); break;
                case '`':  symbol = new Symbol('quasiquote'); break; 
              }
              return new Pair(symbol, new Pair(d, Nil));
            },
        peg$c20 = ",@",
        peg$c21 = { type: "literal", value: ",@", description: "\",@\"" },
        peg$c22 = /^['`,]/,
        peg$c23 = { type: "class", value: "['`,]", description: "['`,]" },
        peg$c24 = "#(",
        peg$c25 = { type: "literal", value: "#(", description: "\"#(\"" },
        peg$c26 = function(ds) { return new Vector(ds); },
        peg$c27 = { type: "other", description: "delimiter" },
        peg$c28 = "\"",
        peg$c29 = { type: "literal", value: "\"", description: "\"\\\"\"" },
        peg$c30 = ";",
        peg$c31 = { type: "literal", value: ";", description: "\";\"" },
        peg$c32 = "|",
        peg$c33 = { type: "literal", value: "|", description: "\"|\"" },
        peg$c34 = void 0,
        peg$c35 = { type: "any", description: "any character" },
        peg$c36 = /^[ \t]/,
        peg$c37 = { type: "class", value: "[ \\t]", description: "[ \\t]" },
        peg$c38 = /^[\n\r]/,
        peg$c39 = { type: "class", value: "[\\n\\r]", description: "[\\n\\r]" },
        peg$c40 = { type: "other", description: "linebreak" },
        peg$c41 = null,
        peg$c42 = "\r",
        peg$c43 = { type: "literal", value: "\r", description: "\"\\r\"" },
        peg$c44 = "\n",
        peg$c45 = { type: "literal", value: "\n", description: "\"\\n\"" },
        peg$c46 = { type: "other", description: "comment" },
        peg$c47 = "#;",
        peg$c48 = { type: "literal", value: "#;", description: "\"#;\"" },
        peg$c49 = "#|",
        peg$c50 = { type: "literal", value: "#|", description: "\"#|\"" },
        peg$c51 = "|#",
        peg$c52 = { type: "literal", value: "|#", description: "\"|#\"" },
        peg$c53 = function(s) { return s.join(''); },
        peg$c54 = function(i, s) { return i + s.join(''); },
        peg$c55 = /^[a-z]/i,
        peg$c56 = { type: "class", value: "[a-z]i", description: "[a-z]i" },
        peg$c57 = /^[!$%&*\/:<=>?\^_~]/,
        peg$c58 = { type: "class", value: "[!$%&*\\/:<=>?\\^_~]", description: "[!$%&*\\/:<=>?\\^_~]" },
        peg$c59 = /^[0-9]/,
        peg$c60 = { type: "class", value: "[0-9]", description: "[0-9]" },
        peg$c61 = /^[a-f]/i,
        peg$c62 = { type: "class", value: "[a-f]i", description: "[a-f]i" },
        peg$c63 = /^[+\-]/,
        peg$c64 = { type: "class", value: "[+\\-]", description: "[+\\-]" },
        peg$c65 = /^[.@]/,
        peg$c66 = { type: "class", value: "[.@]", description: "[.@]" },
        peg$c67 = "\\x",
        peg$c68 = { type: "literal", value: "\\x", description: "\"\\\\x\"" },
        peg$c69 = function(h) { return String.fromCharCode(h); },
        peg$c70 = function(h) { return parseInt(h.join(''), 16); },
        peg$c71 = function(e, d, s) {
              return e + '.' + d + s.join('');
            },
        peg$c72 = function(e, ss, s) {
              return e + ss + s.join('');
            },
        peg$c73 = function(n, ss) {
              return '.' + n + ss.join('');
            },
        peg$c74 = "@",
        peg$c75 = { type: "literal", value: "@", description: "\"@\"" },
        peg$c76 = /^[^|\\]/,
        peg$c77 = { type: "class", value: "[^|\\\\]", description: "[^|\\\\]" },
        peg$c78 = { type: "other", description: "boolean" },
        peg$c79 = "#true",
        peg$c80 = { type: "literal", value: "#true", description: "\"#true\"" },
        peg$c81 = "#t",
        peg$c82 = { type: "literal", value: "#t", description: "\"#t\"" },
        peg$c83 = function() { return new Bool(true);  },
        peg$c84 = "#false",
        peg$c85 = { type: "literal", value: "#false", description: "\"#false\"" },
        peg$c86 = "#f",
        peg$c87 = { type: "literal", value: "#f", description: "\"#f\"" },
        peg$c88 = function() { return new Bool(false); },
        peg$c89 = { type: "other", description: "character" },
        peg$c90 = "#\\x",
        peg$c91 = { type: "literal", value: "#\\x", description: "\"#\\\\x\"" },
        peg$c92 = function(h) { return new Char(String.fromCharCode(h)); },
        peg$c93 = "#\\",
        peg$c94 = { type: "literal", value: "#\\", description: "\"#\\\\\"" },
        peg$c95 = function(c) { return new Char(c); },
        peg$c96 = "alarm",
        peg$c97 = { type: "literal", value: "alarm", description: "\"alarm\"" },
        peg$c98 = function() { return '\u0007'; },
        peg$c99 = "backspace",
        peg$c100 = { type: "literal", value: "backspace", description: "\"backspace\"" },
        peg$c101 = function() { return '\u0008'; },
        peg$c102 = "delete",
        peg$c103 = { type: "literal", value: "delete", description: "\"delete\"" },
        peg$c104 = function() { return '\u007f'; },
        peg$c105 = "escape",
        peg$c106 = { type: "literal", value: "escape", description: "\"escape\"" },
        peg$c107 = function() { return '\u001b'; },
        peg$c108 = "newline",
        peg$c109 = { type: "literal", value: "newline", description: "\"newline\"" },
        peg$c110 = function() { return '\n';     },
        peg$c111 = "null",
        peg$c112 = { type: "literal", value: "null", description: "\"null\"" },
        peg$c113 = function() { return '\0';     },
        peg$c114 = "return",
        peg$c115 = { type: "literal", value: "return", description: "\"return\"" },
        peg$c116 = function() { return '\r';     },
        peg$c117 = "space",
        peg$c118 = { type: "literal", value: "space", description: "\"space\"" },
        peg$c119 = function() { return ' ';      },
        peg$c120 = "tab",
        peg$c121 = { type: "literal", value: "tab", description: "\"tab\"" },
        peg$c122 = function() { return '\t';     },
        peg$c123 = { type: "other", description: "string" },
        peg$c124 = function(ss) { return new Str(ss.join('')); },
        peg$c125 = "\\a",
        peg$c126 = { type: "literal", value: "\\a", description: "\"\\\\a\"" },
        peg$c127 = "\\b",
        peg$c128 = { type: "literal", value: "\\b", description: "\"\\\\b\"" },
        peg$c129 = "\\t",
        peg$c130 = { type: "literal", value: "\\t", description: "\"\\\\t\"" },
        peg$c131 = "\\n",
        peg$c132 = { type: "literal", value: "\\n", description: "\"\\\\n\"" },
        peg$c133 = "\\r",
        peg$c134 = { type: "literal", value: "\\r", description: "\"\\\\r\"" },
        peg$c135 = "\\\"",
        peg$c136 = { type: "literal", value: "\\\"", description: "\"\\\\\\\"\"" },
        peg$c137 = function() { return '"';      },
        peg$c138 = "\\\\",
        peg$c139 = { type: "literal", value: "\\\\", description: "\"\\\\\\\\\"" },
        peg$c140 = function() { return '\\';     },
        peg$c141 = "\\",
        peg$c142 = { type: "literal", value: "\\", description: "\"\\\\\"" },
        peg$c143 = function() { return ''; },
        peg$c144 = /^[^"\\]/,
        peg$c145 = { type: "class", value: "[^\"\\\\]", description: "[^\"\\\\]" },
        peg$c146 = "#u8(",
        peg$c147 = { type: "literal", value: "#u8(", description: "\"#u8(\"" },
        peg$c148 = function(bs) { return new ByteVector(bs); },
        peg$c149 = function(n) { return parseInt(n.join(''), 10); },
        peg$c150 = "25",
        peg$c151 = { type: "literal", value: "25", description: "\"25\"" },
        peg$c152 = /^[0-5]/,
        peg$c153 = { type: "class", value: "[0-5]", description: "[0-5]" },
        peg$c154 = "2",
        peg$c155 = { type: "literal", value: "2", description: "\"2\"" },
        peg$c156 = /^[0-4]/,
        peg$c157 = { type: "class", value: "[0-4]", description: "[0-4]" },
        peg$c158 = "1",
        peg$c159 = { type: "literal", value: "1", description: "\"1\"" },
        peg$c160 = { type: "other", description: "number" },
        peg$c161 = function(n) { return n; },
        peg$c162 = { type: "other", description: "binary number" },
        peg$c163 = function(c) { return c; },
        peg$c164 = function(radius, angle) {
              var real = Math.cos(angle) * radius;
              var imag = Math.sin(angle) * radius;
              return new Complex(real, imag);
            },
        peg$c165 = "i",
        peg$c166 = { type: "literal", value: "i", description: "\"i\"" },
        peg$c167 = function(i) { return new Complex(0, i);  },
        peg$c168 = "+",
        peg$c169 = { type: "literal", value: "+", description: "\"+\"" },
        peg$c170 = function(r, i) { return new Complex(r, i);  },
        peg$c171 = "-",
        peg$c172 = { type: "literal", value: "-", description: "\"-\"" },
        peg$c173 = function(r, i) { return new Complex(r, -i); },
        peg$c174 = "+i",
        peg$c175 = { type: "literal", value: "+i", description: "\"+i\"" },
        peg$c176 = function(r) { return new Complex(r, 1);  },
        peg$c177 = "-i",
        peg$c178 = { type: "literal", value: "-i", description: "\"-i\"" },
        peg$c179 = function(r) { return new Complex(r, -1); },
        peg$c180 = function(i) { return new Complex(0, -i); },
        peg$c181 = function(r) { return new Real(r);        },
        peg$c182 = function() { return new Complex(0, 1);  },
        peg$c183 = function() { return new Complex(0, -1); },
        peg$c184 = function(s, u) { return s === '-' ? -u : u; },
        peg$c185 = "/",
        peg$c186 = { type: "literal", value: "/", description: "\"/\"" },
        peg$c187 = function(numer, denom) { return numer / denom; },
        peg$c188 = function(ds) { return parseInt(ds.join(''), 2); },
        peg$c189 = { type: "other", description: "octal number" },
        peg$c190 = function(ds) { return parseInt(ds.join(''), 8); },
        peg$c191 = { type: "other", description: "decimal number" },
        peg$c192 = function(ds, s) {
              var num = parseFloat('.' + ds.join(''));
              if (s) {
                  num *= Math.pow(10, s);
              }
              return num;
            },
        peg$c193 = function(whole, fraction, s) {
              var num = parseInt(whole.join(''), 10) + parseFloat('.' + fraction.join(''));
              if (s) {
                  num *= Math.pow(10, s);
              }
              return num;
            },
        peg$c194 = function(u, s) {
              if (s) {
                  u *= Math.pow(10, s);
              }
              return u;
            },
        peg$c195 = function(e, s, ds) {
                return parseInt(ds.join(''), 10) * (s === '-' ? -1: 1);
            },
        peg$c196 = /^[esfdl]/,
        peg$c197 = { type: "class", value: "[esfdl]", description: "[esfdl]" },
        peg$c198 = function(ds) { return parseInt(ds.join(''), 10); },
        peg$c199 = { type: "other", description: "hexadecimal number" },
        peg$c200 = function(radius, angle) {
                var real = Math.cos(angle) * radius,
                    imag = Math.sin(angle) * radius;
                return new Complex(real, imag);
            },
        peg$c201 = function(ds) { return parseInt(ds.join(''), 16); },
        peg$c202 = "+inf.0",
        peg$c203 = { type: "literal", value: "+inf.0", description: "\"+inf.0\"" },
        peg$c204 = function() { return Infinity; },
        peg$c205 = "-inf.0",
        peg$c206 = { type: "literal", value: "-inf.0", description: "\"-inf.0\"" },
        peg$c207 = function() { return -Infinity; },
        peg$c208 = "+nan.0",
        peg$c209 = { type: "literal", value: "+nan.0", description: "\"+nan.0\"" },
        peg$c210 = function() { return NaN; },
        peg$c211 = "#i",
        peg$c212 = { type: "literal", value: "#i", description: "\"#i\"" },
        peg$c213 = "#e",
        peg$c214 = { type: "literal", value: "#e", description: "\"#e\"" },
        peg$c215 = "#b",
        peg$c216 = { type: "literal", value: "#b", description: "\"#b\"" },
        peg$c217 = "#o",
        peg$c218 = { type: "literal", value: "#o", description: "\"#o\"" },
        peg$c219 = "#d",
        peg$c220 = { type: "literal", value: "#d", description: "\"#d\"" },
        peg$c221 = "#x",
        peg$c222 = { type: "literal", value: "#x", description: "\"#x\"" },
        peg$c223 = /^[01]/,
        peg$c224 = { type: "class", value: "[01]", description: "[01]" },
        peg$c225 = /^[01234567]/,
        peg$c226 = { type: "class", value: "[01234567]", description: "[01234567]" },
        peg$c227 = /^[abcdef]/i,
        peg$c228 = { type: "class", value: "[abcdef]i", description: "[abcdef]i" },

        peg$currPos          = 0,
        peg$reportedPos      = 0,
        peg$cachedPos        = 0,
        peg$cachedPosDetails = { line: 1, column: 1, seenCR: false },
        peg$maxFailPos       = 0,
        peg$maxFailExpected  = [],
        peg$silentFails      = 0,

        peg$result;

    if ("startRule" in options) {
      if (!(options.startRule in peg$startRuleFunctions)) {
        throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
      }

      peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
    }

    function text() {
      return input.substring(peg$reportedPos, peg$currPos);
    }

    function offset() {
      return peg$reportedPos;
    }

    function line() {
      return peg$computePosDetails(peg$reportedPos).line;
    }

    function column() {
      return peg$computePosDetails(peg$reportedPos).column;
    }

    function expected(description) {
      throw peg$buildException(
        null,
        [{ type: "other", description: description }],
        peg$reportedPos
      );
    }

    function error(message) {
      throw peg$buildException(message, null, peg$reportedPos);
    }

    function peg$computePosDetails(pos) {
      function advance(details, startPos, endPos) {
        var p, ch;

        for (p = startPos; p < endPos; p++) {
          ch = input.charAt(p);
          if (ch === "\n") {
            if (!details.seenCR) { details.line++; }
            details.column = 1;
            details.seenCR = false;
          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
            details.line++;
            details.column = 1;
            details.seenCR = true;
          } else {
            details.column++;
            details.seenCR = false;
          }
        }
      }

      if (peg$cachedPos !== pos) {
        if (peg$cachedPos > pos) {
          peg$cachedPos = 0;
          peg$cachedPosDetails = { line: 1, column: 1, seenCR: false };
        }
        advance(peg$cachedPosDetails, peg$cachedPos, pos);
        peg$cachedPos = pos;
      }

      return peg$cachedPosDetails;
    }

    function peg$fail(expected) {
      if (peg$currPos < peg$maxFailPos) { return; }

      if (peg$currPos > peg$maxFailPos) {
        peg$maxFailPos = peg$currPos;
        peg$maxFailExpected = [];
      }

      peg$maxFailExpected.push(expected);
    }

    function peg$buildException(message, expected, pos) {
      function cleanupExpected(expected) {
        var i = 1;

        expected.sort(function(a, b) {
          if (a.description < b.description) {
            return -1;
          } else if (a.description > b.description) {
            return 1;
          } else {
            return 0;
          }
        });

        while (i < expected.length) {
          if (expected[i - 1] === expected[i]) {
            expected.splice(i, 1);
          } else {
            i++;
          }
        }
      }

      function buildMessage(expected, found) {
        function stringEscape(s) {
          function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }

          return s
            .replace(/\\/g,   '\\\\')
            .replace(/"/g,    '\\"')
            .replace(/\x08/g, '\\b')
            .replace(/\t/g,   '\\t')
            .replace(/\n/g,   '\\n')
            .replace(/\f/g,   '\\f')
            .replace(/\r/g,   '\\r')
            .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return '\\x0' + hex(ch); })
            .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return '\\x'  + hex(ch); })
            .replace(/[\u0180-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
            .replace(/[\u1080-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
        }

        var expectedDescs = new Array(expected.length),
            expectedDesc, foundDesc, i;

        for (i = 0; i < expected.length; i++) {
          expectedDescs[i] = expected[i].description;
        }

        expectedDesc = expected.length > 1
          ? expectedDescs.slice(0, -1).join(", ")
              + " or "
              + expectedDescs[expected.length - 1]
          : expectedDescs[0];

        foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";

        return "Expected " + expectedDesc + " but " + foundDesc + " found.";
      }

      var posDetails = peg$computePosDetails(pos),
          found      = pos < input.length ? input.charAt(pos) : null;

      if (expected !== null) {
        cleanupExpected(expected);
      }

      return new SyntaxError(
        message !== null ? message : buildMessage(expected, found),
        expected,
        found,
        pos,
        posDetails.line,
        posDetails.column
      );
    }

    function peg$parsestart() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseintertokenSpace();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsedatum();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parsedatum();
        }
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c2(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parsedatum() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseintertokenSpace();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesimpleDatum();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseintertokenSpace();
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c4(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$parsecompoundDatum();
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$currPos;
          s2 = peg$parselabel();
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 61) {
              s3 = peg$c5;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c6); }
            }
            if (s3 !== peg$FAILED) {
              s4 = peg$parsedatum();
              if (s4 !== peg$FAILED) {
                s2 = [s2, s3, s4];
                s1 = s2;
              } else {
                peg$currPos = s1;
                s1 = peg$c0;
              }
            } else {
              peg$currPos = s1;
              s1 = peg$c0;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$c0;
          }
          if (s1 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c4(s1);
          }
          s0 = s1;
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$currPos;
            s2 = peg$parselabel();
            if (s2 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 35) {
                s3 = peg$c7;
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c8); }
              }
              if (s3 !== peg$FAILED) {
                s2 = [s2, s3];
                s1 = s2;
              } else {
                peg$currPos = s1;
                s1 = peg$c0;
              }
            } else {
              peg$currPos = s1;
              s1 = peg$c0;
            }
            if (s1 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c4(s1);
            }
            s0 = s1;
          }
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c3); }
      }

      return s0;
    }

    function peg$parsesimpleDatum() {
      var s0;

      s0 = peg$parseboolean();
      if (s0 === peg$FAILED) {
        s0 = peg$parsenumber();
        if (s0 === peg$FAILED) {
          s0 = peg$parsecharacter();
          if (s0 === peg$FAILED) {
            s0 = peg$parsestring();
            if (s0 === peg$FAILED) {
              s0 = peg$parsesymbol();
              if (s0 === peg$FAILED) {
                s0 = peg$parsebytevector();
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parsesymbol() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parseidentifier();
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c9(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsecompoundDatum() {
      var s0;

      s0 = peg$parselist();
      if (s0 === peg$FAILED) {
        s0 = peg$parsevector();
      }

      return s0;
    }

    function peg$parselist() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11;

      s0 = peg$currPos;
      s1 = peg$parseintertokenSpace();
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 40) {
          s2 = peg$c10;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c11); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseintertokenSpace();
          if (s3 !== peg$FAILED) {
            s4 = [];
            s5 = peg$parsedatum();
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              s5 = peg$parsedatum();
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parseintertokenSpace();
              if (s5 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 41) {
                  s6 = peg$c12;
                  peg$currPos++;
                } else {
                  s6 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c13); }
                }
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseintertokenSpace();
                  if (s7 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c14(s4);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseintertokenSpace();
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 40) {
            s2 = peg$c10;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c11); }
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parseintertokenSpace();
            if (s3 !== peg$FAILED) {
              s4 = [];
              s5 = peg$parsedatum();
              if (s5 !== peg$FAILED) {
                while (s5 !== peg$FAILED) {
                  s4.push(s5);
                  s5 = peg$parsedatum();
                }
              } else {
                s4 = peg$c0;
              }
              if (s4 !== peg$FAILED) {
                s5 = peg$parseintertokenSpace();
                if (s5 !== peg$FAILED) {
                  s6 = peg$currPos;
                  if (input.charCodeAt(peg$currPos) === 46) {
                    s7 = peg$c15;
                    peg$currPos++;
                  } else {
                    s7 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c16); }
                  }
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parse_();
                    if (s8 !== peg$FAILED) {
                      s7 = [s7, s8];
                      s6 = s7;
                    } else {
                      peg$currPos = s6;
                      s6 = peg$c0;
                    }
                  } else {
                    peg$currPos = s6;
                    s6 = peg$c0;
                  }
                  if (s6 !== peg$FAILED) {
                    s7 = peg$parseintertokenSpace();
                    if (s7 !== peg$FAILED) {
                      s8 = peg$parsedatum();
                      if (s8 !== peg$FAILED) {
                        s9 = peg$parseintertokenSpace();
                        if (s9 !== peg$FAILED) {
                          if (input.charCodeAt(peg$currPos) === 41) {
                            s10 = peg$c12;
                            peg$currPos++;
                          } else {
                            s10 = peg$FAILED;
                            if (peg$silentFails === 0) { peg$fail(peg$c13); }
                          }
                          if (s10 !== peg$FAILED) {
                            s11 = peg$parseintertokenSpace();
                            if (s11 !== peg$FAILED) {
                              peg$reportedPos = s0;
                              s1 = peg$c17(s4, s8);
                              s0 = s1;
                            } else {
                              peg$currPos = s0;
                              s0 = peg$c0;
                            }
                          } else {
                            peg$currPos = s0;
                            s0 = peg$c0;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$c0;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$c0;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c0;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parseintertokenSpace();
          if (s1 !== peg$FAILED) {
            s2 = peg$parseabbreviation();
            if (s2 !== peg$FAILED) {
              s3 = peg$parseintertokenSpace();
              if (s3 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c18(s2);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        }
      }

      return s0;
    }

    function peg$parseabbreviation() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseabbrevPrefix();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsedatum();
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c19(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseabbrevPrefix() {
      var s0;

      if (input.substr(peg$currPos, 2) === peg$c20) {
        s0 = peg$c20;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c21); }
      }
      if (s0 === peg$FAILED) {
        if (peg$c22.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c23); }
        }
      }

      return s0;
    }

    function peg$parsevector() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      s0 = peg$currPos;
      s1 = peg$parseintertokenSpace();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c24) {
          s2 = peg$c24;
          peg$currPos += 2;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c25); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseintertokenSpace();
          if (s3 !== peg$FAILED) {
            s4 = [];
            s5 = peg$parsedatum();
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              s5 = peg$parsedatum();
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parseintertokenSpace();
              if (s5 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 41) {
                  s6 = peg$c12;
                  peg$currPos++;
                } else {
                  s6 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c13); }
                }
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseintertokenSpace();
                  if (s7 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c26(s4);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parselabel() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 35) {
        s1 = peg$c7;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c8); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsedigit();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsedigit();
          }
        } else {
          s2 = peg$c0;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parsedelimiter() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parsewhitespace();
      if (s0 === peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 40) {
          s0 = peg$c10;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c11); }
        }
        if (s0 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 41) {
            s0 = peg$c12;
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c13); }
          }
          if (s0 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 34) {
              s0 = peg$c28;
              peg$currPos++;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c29); }
            }
            if (s0 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 59) {
                s0 = peg$c30;
                peg$currPos++;
              } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c31); }
              }
              if (s0 === peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 124) {
                  s0 = peg$c32;
                  peg$currPos++;
                } else {
                  s0 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c33); }
                }
              }
            }
          }
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c27); }
      }

      return s0;
    }

    function peg$parseEOF() {
      var s0, s1;

      s0 = peg$currPos;
      peg$silentFails++;
      if (input.length > peg$currPos) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c35); }
      }
      peg$silentFails--;
      if (s1 === peg$FAILED) {
        s0 = peg$c34;
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parse_() {
      var s0, s1;

      s0 = peg$currPos;
      peg$silentFails++;
      s1 = peg$parsedelimiter();
      if (s1 === peg$FAILED) {
        s1 = peg$parseEOF();
      }
      peg$silentFails--;
      if (s1 !== peg$FAILED) {
        peg$currPos = s0;
        s0 = peg$c34;
      } else {
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseintralineWhitespace() {
      var s0;

      if (peg$c36.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c37); }
      }

      return s0;
    }

    function peg$parsewhitespace() {
      var s0;

      s0 = peg$parseintralineWhitespace();
      if (s0 === peg$FAILED) {
        if (peg$c38.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c39); }
        }
      }

      return s0;
    }

    function peg$parselinebreak() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 13) {
        s1 = peg$c42;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c43); }
      }
      if (s1 === peg$FAILED) {
        s1 = peg$c41;
      }
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 10) {
          s2 = peg$c44;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c45); }
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c40); }
      }

      return s0;
    }

    function peg$parsecomment() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 59) {
        s1 = peg$c30;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c31); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$currPos;
        peg$silentFails++;
        s5 = peg$parselinebreak();
        peg$silentFails--;
        if (s5 === peg$FAILED) {
          s4 = peg$c34;
        } else {
          peg$currPos = s4;
          s4 = peg$c0;
        }
        if (s4 !== peg$FAILED) {
          if (input.length > peg$currPos) {
            s5 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c35); }
          }
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$c0;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$currPos;
          peg$silentFails++;
          s5 = peg$parselinebreak();
          peg$silentFails--;
          if (s5 === peg$FAILED) {
            s4 = peg$c34;
          } else {
            peg$currPos = s4;
            s4 = peg$c0;
          }
          if (s4 !== peg$FAILED) {
            if (input.length > peg$currPos) {
              s5 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c35); }
            }
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$parsenestedComment();
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.substr(peg$currPos, 2) === peg$c47) {
            s1 = peg$c47;
            peg$currPos += 2;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c48); }
          }
          if (s1 !== peg$FAILED) {
            s2 = [];
            s3 = peg$parsewhitespace();
            while (s3 !== peg$FAILED) {
              s2.push(s3);
              s3 = peg$parsewhitespace();
            }
            if (s2 !== peg$FAILED) {
              s3 = peg$parsedatum();
              if (s3 !== peg$FAILED) {
                s1 = [s1, s2, s3];
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c46); }
      }

      return s0;
    }

    function peg$parsenestedComment() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c49) {
        s1 = peg$c49;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c50); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsecommentText();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parsecommentText();
        }
        if (s2 !== peg$FAILED) {
          if (input.substr(peg$currPos, 2) === peg$c51) {
            s3 = peg$c51;
            peg$currPos += 2;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c52); }
          }
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parsecommentText() {
      var s0, s1, s2, s3;

      s0 = peg$parsenestedComment();
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$currPos;
        peg$silentFails++;
        if (input.substr(peg$currPos, 2) === peg$c49) {
          s2 = peg$c49;
          peg$currPos += 2;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c50); }
        }
        peg$silentFails--;
        if (s2 === peg$FAILED) {
          s1 = peg$c34;
        } else {
          peg$currPos = s1;
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$currPos;
          peg$silentFails++;
          if (input.substr(peg$currPos, 2) === peg$c51) {
            s3 = peg$c51;
            peg$currPos += 2;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c52); }
          }
          peg$silentFails--;
          if (s3 === peg$FAILED) {
            s2 = peg$c34;
          } else {
            peg$currPos = s2;
            s2 = peg$c0;
          }
          if (s2 !== peg$FAILED) {
            if (input.length > peg$currPos) {
              s3 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c35); }
            }
            if (s3 !== peg$FAILED) {
              s1 = [s1, s2, s3];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      }

      return s0;
    }

    function peg$parseatmosphere() {
      var s0;

      s0 = peg$parsewhitespace();
      if (s0 === peg$FAILED) {
        s0 = peg$parsecomment();
      }

      return s0;
    }

    function peg$parseintertokenSpace() {
      var s0, s1;

      s0 = [];
      s1 = peg$parseatmosphere();
      while (s1 !== peg$FAILED) {
        s0.push(s1);
        s1 = peg$parseatmosphere();
      }

      return s0;
    }

    function peg$parseidentifier() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 124) {
        s1 = peg$c32;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c33); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsesymbolElement();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parsesymbolElement();
        }
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 124) {
            s3 = peg$c32;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c33); }
          }
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c53(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$parsepeculiarIdentifier();
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parseinitial();
          if (s1 !== peg$FAILED) {
            s2 = [];
            s3 = peg$parsesubsequent();
            while (s3 !== peg$FAILED) {
              s2.push(s3);
              s3 = peg$parsesubsequent();
            }
            if (s2 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c54(s1, s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        }
      }

      return s0;
    }

    function peg$parseinitial() {
      var s0;

      s0 = peg$parseletter();
      if (s0 === peg$FAILED) {
        s0 = peg$parsespecialInitial();
        if (s0 === peg$FAILED) {
          s0 = peg$parseinlineHexEscape();
        }
      }

      return s0;
    }

    function peg$parseletter() {
      var s0;

      if (peg$c55.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c56); }
      }

      return s0;
    }

    function peg$parsespecialInitial() {
      var s0;

      if (peg$c57.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c58); }
      }

      return s0;
    }

    function peg$parsesubsequent() {
      var s0;

      s0 = peg$parseinitial();
      if (s0 === peg$FAILED) {
        s0 = peg$parsedigit();
        if (s0 === peg$FAILED) {
          s0 = peg$parsespecialSubsequent();
        }
      }

      return s0;
    }

    function peg$parsedigit() {
      var s0;

      if (peg$c59.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c60); }
      }

      return s0;
    }

    function peg$parsehexDigit() {
      var s0;

      s0 = peg$parsedigit();
      if (s0 === peg$FAILED) {
        if (peg$c61.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c62); }
        }
      }

      return s0;
    }

    function peg$parseexplicitSign() {
      var s0;

      if (peg$c63.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c64); }
      }

      return s0;
    }

    function peg$parsespecialSubsequent() {
      var s0;

      s0 = peg$parseexplicitSign();
      if (s0 === peg$FAILED) {
        if (peg$c65.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c66); }
        }
      }

      return s0;
    }

    function peg$parseinlineHexEscape() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c67) {
        s1 = peg$c67;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c68); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsehexScalarValue();
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 59) {
            s3 = peg$c30;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c31); }
          }
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c69(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parsehexScalarValue() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parsehexDigit();
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parsehexDigit();
        }
      } else {
        s1 = peg$c0;
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c70(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsepeculiarIdentifier() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseexplicitSign();
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 46) {
          s2 = peg$c15;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c16); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsedotSubsequent();
          if (s3 !== peg$FAILED) {
            s4 = [];
            s5 = peg$parsesubsequent();
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              s5 = peg$parsesubsequent();
            }
            if (s4 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c71(s1, s3, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseexplicitSign();
        if (s1 !== peg$FAILED) {
          s2 = peg$parsesignSubsequent();
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parsesubsequent();
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parsesubsequent();
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c72(s1, s2, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$parseexplicitSign();
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 46) {
              s1 = peg$c15;
              peg$currPos++;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c16); }
            }
            if (s1 !== peg$FAILED) {
              s2 = peg$parsenonDigit();
              if (s2 !== peg$FAILED) {
                s3 = [];
                s4 = peg$parsesubsequent();
                while (s4 !== peg$FAILED) {
                  s3.push(s4);
                  s4 = peg$parsesubsequent();
                }
                if (s3 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c73(s2, s3);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          }
        }
      }

      return s0;
    }

    function peg$parsenonDigit() {
      var s0;

      s0 = peg$parsedotSubsequent();
      if (s0 === peg$FAILED) {
        s0 = peg$parseexplicitSign();
      }

      return s0;
    }

    function peg$parsedotSubsequent() {
      var s0;

      if (input.charCodeAt(peg$currPos) === 46) {
        s0 = peg$c15;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c16); }
      }
      if (s0 === peg$FAILED) {
        s0 = peg$parsesignSubsequent();
      }

      return s0;
    }

    function peg$parsesignSubsequent() {
      var s0;

      if (input.charCodeAt(peg$currPos) === 64) {
        s0 = peg$c74;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c75); }
      }
      if (s0 === peg$FAILED) {
        s0 = peg$parseexplicitSign();
        if (s0 === peg$FAILED) {
          s0 = peg$parseinitial();
        }
      }

      return s0;
    }

    function peg$parsesymbolElement() {
      var s0;

      s0 = peg$parseinlineHexEscape();
      if (s0 === peg$FAILED) {
        if (peg$c76.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c77); }
        }
      }

      return s0;
    }

    function peg$parseboolean() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 5) === peg$c79) {
        s1 = peg$c79;
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c80); }
      }
      if (s1 === peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c81) {
          s1 = peg$c81;
          peg$currPos += 2;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c82); }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c83();
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 6) === peg$c84) {
          s1 = peg$c84;
          peg$currPos += 6;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c85); }
        }
        if (s1 === peg$FAILED) {
          if (input.substr(peg$currPos, 2) === peg$c86) {
            s1 = peg$c86;
            peg$currPos += 2;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c87); }
          }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c88();
        }
        s0 = s1;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c78); }
      }

      return s0;
    }

    function peg$parsecharacter() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 3) === peg$c90) {
        s1 = peg$c90;
        peg$currPos += 3;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c91); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsehexScalarValue();
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c92(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 2) === peg$c93) {
          s1 = peg$c93;
          peg$currPos += 2;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c94); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parsecharacterName();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c95(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.substr(peg$currPos, 2) === peg$c93) {
            s1 = peg$c93;
            peg$currPos += 2;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c94); }
          }
          if (s1 !== peg$FAILED) {
            if (input.length > peg$currPos) {
              s2 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c35); }
            }
            if (s2 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c95(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c89); }
      }

      return s0;
    }

    function peg$parsecharacterName() {
      var s0, s1;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 5) === peg$c96) {
        s1 = peg$c96;
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c97); }
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c98();
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 9) === peg$c99) {
          s1 = peg$c99;
          peg$currPos += 9;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c100); }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c101();
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.substr(peg$currPos, 6) === peg$c102) {
            s1 = peg$c102;
            peg$currPos += 6;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c103); }
          }
          if (s1 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c104();
          }
          s0 = s1;
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            if (input.substr(peg$currPos, 6) === peg$c105) {
              s1 = peg$c105;
              peg$currPos += 6;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c106); }
            }
            if (s1 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c107();
            }
            s0 = s1;
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              if (input.substr(peg$currPos, 7) === peg$c108) {
                s1 = peg$c108;
                peg$currPos += 7;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c109); }
              }
              if (s1 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c110();
              }
              s0 = s1;
              if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                if (input.substr(peg$currPos, 4) === peg$c111) {
                  s1 = peg$c111;
                  peg$currPos += 4;
                } else {
                  s1 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c112); }
                }
                if (s1 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c113();
                }
                s0 = s1;
                if (s0 === peg$FAILED) {
                  s0 = peg$currPos;
                  if (input.substr(peg$currPos, 6) === peg$c114) {
                    s1 = peg$c114;
                    peg$currPos += 6;
                  } else {
                    s1 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c115); }
                  }
                  if (s1 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c116();
                  }
                  s0 = s1;
                  if (s0 === peg$FAILED) {
                    s0 = peg$currPos;
                    if (input.substr(peg$currPos, 5) === peg$c117) {
                      s1 = peg$c117;
                      peg$currPos += 5;
                    } else {
                      s1 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c118); }
                    }
                    if (s1 !== peg$FAILED) {
                      peg$reportedPos = s0;
                      s1 = peg$c119();
                    }
                    s0 = s1;
                    if (s0 === peg$FAILED) {
                      s0 = peg$currPos;
                      if (input.substr(peg$currPos, 3) === peg$c120) {
                        s1 = peg$c120;
                        peg$currPos += 3;
                      } else {
                        s1 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c121); }
                      }
                      if (s1 !== peg$FAILED) {
                        peg$reportedPos = s0;
                        s1 = peg$c122();
                      }
                      s0 = s1;
                    }
                  }
                }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parsestring() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 34) {
        s1 = peg$c28;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c29); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsestringElement();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parsestringElement();
        }
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 34) {
            s3 = peg$c28;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c29); }
          }
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c124(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c123); }
      }

      return s0;
    }

    function peg$parsestringElement() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c125) {
        s1 = peg$c125;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c126); }
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c98();
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 2) === peg$c127) {
          s1 = peg$c127;
          peg$currPos += 2;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c128); }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c101();
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.substr(peg$currPos, 2) === peg$c129) {
            s1 = peg$c129;
            peg$currPos += 2;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c130); }
          }
          if (s1 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c122();
          }
          s0 = s1;
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            if (input.substr(peg$currPos, 2) === peg$c131) {
              s1 = peg$c131;
              peg$currPos += 2;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c132); }
            }
            if (s1 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c110();
            }
            s0 = s1;
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              if (input.substr(peg$currPos, 2) === peg$c133) {
                s1 = peg$c133;
                peg$currPos += 2;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c134); }
              }
              if (s1 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c116();
              }
              s0 = s1;
              if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                if (input.substr(peg$currPos, 2) === peg$c135) {
                  s1 = peg$c135;
                  peg$currPos += 2;
                } else {
                  s1 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c136); }
                }
                if (s1 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c137();
                }
                s0 = s1;
                if (s0 === peg$FAILED) {
                  s0 = peg$currPos;
                  if (input.substr(peg$currPos, 2) === peg$c138) {
                    s1 = peg$c138;
                    peg$currPos += 2;
                  } else {
                    s1 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c139); }
                  }
                  if (s1 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c140();
                  }
                  s0 = s1;
                  if (s0 === peg$FAILED) {
                    s0 = peg$currPos;
                    if (input.charCodeAt(peg$currPos) === 92) {
                      s1 = peg$c141;
                      peg$currPos++;
                    } else {
                      s1 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c142); }
                    }
                    if (s1 !== peg$FAILED) {
                      s2 = [];
                      s3 = peg$parseintralineWhitespace();
                      while (s3 !== peg$FAILED) {
                        s2.push(s3);
                        s3 = peg$parseintralineWhitespace();
                      }
                      if (s2 !== peg$FAILED) {
                        s3 = peg$parselinebreak();
                        if (s3 !== peg$FAILED) {
                          s4 = [];
                          s5 = peg$parseintralineWhitespace();
                          while (s5 !== peg$FAILED) {
                            s4.push(s5);
                            s5 = peg$parseintralineWhitespace();
                          }
                          if (s4 !== peg$FAILED) {
                            peg$reportedPos = s0;
                            s1 = peg$c143();
                            s0 = s1;
                          } else {
                            peg$currPos = s0;
                            s0 = peg$c0;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$c0;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$c0;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c0;
                    }
                    if (s0 === peg$FAILED) {
                      s0 = peg$parseinlineHexEscape();
                      if (s0 === peg$FAILED) {
                        if (peg$c144.test(input.charAt(peg$currPos))) {
                          s0 = input.charAt(peg$currPos);
                          peg$currPos++;
                        } else {
                          s0 = peg$FAILED;
                          if (peg$silentFails === 0) { peg$fail(peg$c145); }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parsebytevector() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      s0 = peg$currPos;
      s1 = peg$parseintertokenSpace();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 4) === peg$c146) {
          s2 = peg$c146;
          peg$currPos += 4;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c147); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseintertokenSpace();
          if (s3 !== peg$FAILED) {
            s4 = [];
            s5 = peg$parsebyte();
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              s5 = peg$parsebyte();
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parseintertokenSpace();
              if (s5 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 41) {
                  s6 = peg$c12;
                  peg$currPos++;
                } else {
                  s6 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c13); }
                }
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseintertokenSpace();
                  if (s7 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c148(s4);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parsebyte() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseintertokenSpace();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsenum255();
        if (s2 !== peg$FAILED) {
          s3 = peg$parse_();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseintertokenSpace();
            if (s4 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c149(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parsenum255() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c150) {
        s1 = peg$c150;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c151); }
      }
      if (s1 !== peg$FAILED) {
        if (peg$c152.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c153); }
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 50) {
          s1 = peg$c154;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c155); }
        }
        if (s1 !== peg$FAILED) {
          if (peg$c156.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c157); }
          }
          if (s2 !== peg$FAILED) {
            if (peg$c59.test(input.charAt(peg$currPos))) {
              s3 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c60); }
            }
            if (s3 !== peg$FAILED) {
              s1 = [s1, s2, s3];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 49) {
            s1 = peg$c158;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c159); }
          }
          if (s1 !== peg$FAILED) {
            if (peg$c59.test(input.charAt(peg$currPos))) {
              s2 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c60); }
            }
            if (s2 !== peg$FAILED) {
              if (peg$c59.test(input.charAt(peg$currPos))) {
                s3 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c60); }
              }
              if (s3 !== peg$FAILED) {
                s1 = [s1, s2, s3];
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            if (peg$c59.test(input.charAt(peg$currPos))) {
              s1 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c60); }
            }
            if (s1 !== peg$FAILED) {
              if (peg$c59.test(input.charAt(peg$currPos))) {
                s2 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c60); }
              }
              if (s2 === peg$FAILED) {
                s2 = peg$c41;
              }
              if (s2 !== peg$FAILED) {
                s1 = [s1, s2];
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          }
        }
      }

      return s0;
    }

    function peg$parsenumber() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsenum2();
      if (s1 === peg$FAILED) {
        s1 = peg$parsenum8();
        if (s1 === peg$FAILED) {
          s1 = peg$parsenum10();
          if (s1 === peg$FAILED) {
            s1 = peg$parsenum16();
          }
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c161(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c160); }
      }

      return s0;
    }

    function peg$parsenum2() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseprefix2();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecomplex2();
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c163(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c162); }
      }

      return s0;
    }

    function peg$parsecomplex2() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parsereal2();
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 64) {
          s2 = peg$c74;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c75); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsereal2();
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c164(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseinfinity();
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 105) {
            s2 = peg$c165;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c166); }
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c167(s1);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parsereal2();
          if (s1 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 43) {
              s2 = peg$c168;
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c169); }
            }
            if (s2 !== peg$FAILED) {
              s3 = peg$parseureal2();
              if (s3 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 105) {
                  s4 = peg$c165;
                  peg$currPos++;
                } else {
                  s4 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c166); }
                }
                if (s4 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c170(s1, s3);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parsereal2();
            if (s1 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 45) {
                s2 = peg$c171;
                peg$currPos++;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c172); }
              }
              if (s2 !== peg$FAILED) {
                s3 = peg$parseureal2();
                if (s3 !== peg$FAILED) {
                  if (input.charCodeAt(peg$currPos) === 105) {
                    s4 = peg$c165;
                    peg$currPos++;
                  } else {
                    s4 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c166); }
                  }
                  if (s4 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c173(s1, s3);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              s1 = peg$parsereal2();
              if (s1 !== peg$FAILED) {
                s2 = peg$parseinfinity();
                if (s2 !== peg$FAILED) {
                  if (input.charCodeAt(peg$currPos) === 105) {
                    s3 = peg$c165;
                    peg$currPos++;
                  } else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c166); }
                  }
                  if (s3 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c170(s1, s2);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
              if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                s1 = peg$parsereal2();
                if (s1 !== peg$FAILED) {
                  if (input.substr(peg$currPos, 2) === peg$c174) {
                    s2 = peg$c174;
                    peg$currPos += 2;
                  } else {
                    s2 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c175); }
                  }
                  if (s2 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c176(s1);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
                if (s0 === peg$FAILED) {
                  s0 = peg$currPos;
                  s1 = peg$parsereal2();
                  if (s1 !== peg$FAILED) {
                    if (input.substr(peg$currPos, 2) === peg$c177) {
                      s2 = peg$c177;
                      peg$currPos += 2;
                    } else {
                      s2 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c178); }
                    }
                    if (s2 !== peg$FAILED) {
                      peg$reportedPos = s0;
                      s1 = peg$c179(s1);
                      s0 = s1;
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c0;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                  if (s0 === peg$FAILED) {
                    s0 = peg$currPos;
                    if (input.charCodeAt(peg$currPos) === 43) {
                      s1 = peg$c168;
                      peg$currPos++;
                    } else {
                      s1 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c169); }
                    }
                    if (s1 !== peg$FAILED) {
                      s2 = peg$parseureal2();
                      if (s2 !== peg$FAILED) {
                        if (input.charCodeAt(peg$currPos) === 105) {
                          s3 = peg$c165;
                          peg$currPos++;
                        } else {
                          s3 = peg$FAILED;
                          if (peg$silentFails === 0) { peg$fail(peg$c166); }
                        }
                        if (s3 !== peg$FAILED) {
                          peg$reportedPos = s0;
                          s1 = peg$c167(s2);
                          s0 = s1;
                        } else {
                          peg$currPos = s0;
                          s0 = peg$c0;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$c0;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c0;
                    }
                    if (s0 === peg$FAILED) {
                      s0 = peg$currPos;
                      if (input.charCodeAt(peg$currPos) === 45) {
                        s1 = peg$c171;
                        peg$currPos++;
                      } else {
                        s1 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c172); }
                      }
                      if (s1 !== peg$FAILED) {
                        s2 = peg$parseureal2();
                        if (s2 !== peg$FAILED) {
                          if (input.charCodeAt(peg$currPos) === 105) {
                            s3 = peg$c165;
                            peg$currPos++;
                          } else {
                            s3 = peg$FAILED;
                            if (peg$silentFails === 0) { peg$fail(peg$c166); }
                          }
                          if (s3 !== peg$FAILED) {
                            peg$reportedPos = s0;
                            s1 = peg$c180(s2);
                            s0 = s1;
                          } else {
                            peg$currPos = s0;
                            s0 = peg$c0;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$c0;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$c0;
                      }
                      if (s0 === peg$FAILED) {
                        s0 = peg$currPos;
                        s1 = peg$parsereal2();
                        if (s1 !== peg$FAILED) {
                          peg$reportedPos = s0;
                          s1 = peg$c181(s1);
                        }
                        s0 = s1;
                        if (s0 === peg$FAILED) {
                          s0 = peg$currPos;
                          if (input.substr(peg$currPos, 2) === peg$c174) {
                            s1 = peg$c174;
                            peg$currPos += 2;
                          } else {
                            s1 = peg$FAILED;
                            if (peg$silentFails === 0) { peg$fail(peg$c175); }
                          }
                          if (s1 !== peg$FAILED) {
                            peg$reportedPos = s0;
                            s1 = peg$c182();
                          }
                          s0 = s1;
                          if (s0 === peg$FAILED) {
                            s0 = peg$currPos;
                            if (input.substr(peg$currPos, 2) === peg$c177) {
                              s1 = peg$c177;
                              peg$currPos += 2;
                            } else {
                              s1 = peg$FAILED;
                              if (peg$silentFails === 0) { peg$fail(peg$c178); }
                            }
                            if (s1 !== peg$FAILED) {
                              peg$reportedPos = s0;
                              s1 = peg$c183();
                            }
                            s0 = s1;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parsereal2() {
      var s0, s1, s2;

      s0 = peg$parseinfinity();
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parsesign();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseureal2();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c184(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      }

      return s0;
    }

    function peg$parseureal2() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseuinteger2();
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 47) {
          s2 = peg$c185;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c186); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseuinteger2();
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c187(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$parseuinteger2();
      }

      return s0;
    }

    function peg$parseuinteger2() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parsedigit2();
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parsedigit2();
        }
      } else {
        s1 = peg$c0;
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c188(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseprefix2() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseradix2();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseexactness();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseexactness();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseradix2();
          if (s2 !== peg$FAILED) {
            s1 = [s1, s2];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      }

      return s0;
    }

    function peg$parsenum8() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseprefix8();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecomplex8();
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c163(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c189); }
      }

      return s0;
    }

    function peg$parsecomplex8() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parsereal8();
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 64) {
          s2 = peg$c74;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c75); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsereal8();
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c164(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseinfinity();
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 105) {
            s2 = peg$c165;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c166); }
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c167(s1);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parsereal8();
          if (s1 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 43) {
              s2 = peg$c168;
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c169); }
            }
            if (s2 !== peg$FAILED) {
              s3 = peg$parseureal8();
              if (s3 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 105) {
                  s4 = peg$c165;
                  peg$currPos++;
                } else {
                  s4 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c166); }
                }
                if (s4 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c170(s1, s3);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parsereal8();
            if (s1 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 45) {
                s2 = peg$c171;
                peg$currPos++;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c172); }
              }
              if (s2 !== peg$FAILED) {
                s3 = peg$parseureal8();
                if (s3 !== peg$FAILED) {
                  if (input.charCodeAt(peg$currPos) === 105) {
                    s4 = peg$c165;
                    peg$currPos++;
                  } else {
                    s4 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c166); }
                  }
                  if (s4 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c173(s1, s3);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              s1 = peg$parsereal8();
              if (s1 !== peg$FAILED) {
                s2 = peg$parseinfinity();
                if (s2 !== peg$FAILED) {
                  if (input.charCodeAt(peg$currPos) === 105) {
                    s3 = peg$c165;
                    peg$currPos++;
                  } else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c166); }
                  }
                  if (s3 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c170(s1, s2);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
              if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                s1 = peg$parsereal8();
                if (s1 !== peg$FAILED) {
                  if (input.substr(peg$currPos, 2) === peg$c174) {
                    s2 = peg$c174;
                    peg$currPos += 2;
                  } else {
                    s2 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c175); }
                  }
                  if (s2 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c176(s1);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
                if (s0 === peg$FAILED) {
                  s0 = peg$currPos;
                  s1 = peg$parsereal8();
                  if (s1 !== peg$FAILED) {
                    if (input.substr(peg$currPos, 2) === peg$c177) {
                      s2 = peg$c177;
                      peg$currPos += 2;
                    } else {
                      s2 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c178); }
                    }
                    if (s2 !== peg$FAILED) {
                      peg$reportedPos = s0;
                      s1 = peg$c179(s1);
                      s0 = s1;
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c0;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                  if (s0 === peg$FAILED) {
                    s0 = peg$currPos;
                    if (input.charCodeAt(peg$currPos) === 43) {
                      s1 = peg$c168;
                      peg$currPos++;
                    } else {
                      s1 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c169); }
                    }
                    if (s1 !== peg$FAILED) {
                      s2 = peg$parseureal8();
                      if (s2 !== peg$FAILED) {
                        if (input.charCodeAt(peg$currPos) === 105) {
                          s3 = peg$c165;
                          peg$currPos++;
                        } else {
                          s3 = peg$FAILED;
                          if (peg$silentFails === 0) { peg$fail(peg$c166); }
                        }
                        if (s3 !== peg$FAILED) {
                          peg$reportedPos = s0;
                          s1 = peg$c167(s2);
                          s0 = s1;
                        } else {
                          peg$currPos = s0;
                          s0 = peg$c0;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$c0;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c0;
                    }
                    if (s0 === peg$FAILED) {
                      s0 = peg$currPos;
                      if (input.charCodeAt(peg$currPos) === 45) {
                        s1 = peg$c171;
                        peg$currPos++;
                      } else {
                        s1 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c172); }
                      }
                      if (s1 !== peg$FAILED) {
                        s2 = peg$parseureal8();
                        if (s2 !== peg$FAILED) {
                          if (input.charCodeAt(peg$currPos) === 105) {
                            s3 = peg$c165;
                            peg$currPos++;
                          } else {
                            s3 = peg$FAILED;
                            if (peg$silentFails === 0) { peg$fail(peg$c166); }
                          }
                          if (s3 !== peg$FAILED) {
                            peg$reportedPos = s0;
                            s1 = peg$c180(s2);
                            s0 = s1;
                          } else {
                            peg$currPos = s0;
                            s0 = peg$c0;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$c0;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$c0;
                      }
                      if (s0 === peg$FAILED) {
                        s0 = peg$currPos;
                        s1 = peg$parsereal8();
                        if (s1 !== peg$FAILED) {
                          peg$reportedPos = s0;
                          s1 = peg$c181(s1);
                        }
                        s0 = s1;
                        if (s0 === peg$FAILED) {
                          s0 = peg$currPos;
                          if (input.substr(peg$currPos, 2) === peg$c174) {
                            s1 = peg$c174;
                            peg$currPos += 2;
                          } else {
                            s1 = peg$FAILED;
                            if (peg$silentFails === 0) { peg$fail(peg$c175); }
                          }
                          if (s1 !== peg$FAILED) {
                            peg$reportedPos = s0;
                            s1 = peg$c182();
                          }
                          s0 = s1;
                          if (s0 === peg$FAILED) {
                            s0 = peg$currPos;
                            if (input.substr(peg$currPos, 2) === peg$c177) {
                              s1 = peg$c177;
                              peg$currPos += 2;
                            } else {
                              s1 = peg$FAILED;
                              if (peg$silentFails === 0) { peg$fail(peg$c178); }
                            }
                            if (s1 !== peg$FAILED) {
                              peg$reportedPos = s0;
                              s1 = peg$c183();
                            }
                            s0 = s1;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parsereal8() {
      var s0, s1, s2;

      s0 = peg$parseinfinity();
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parsesign();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseureal8();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c184(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      }

      return s0;
    }

    function peg$parseureal8() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseuinteger8();
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 47) {
          s2 = peg$c185;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c186); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseuinteger8();
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c187(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$parseuinteger8();
      }

      return s0;
    }

    function peg$parseuinteger8() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parsedigit8();
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parsedigit8();
        }
      } else {
        s1 = peg$c0;
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c190(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseprefix8() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseradix8();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseexactness();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseexactness();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseradix8();
          if (s2 !== peg$FAILED) {
            s1 = [s1, s2];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      }

      return s0;
    }

    function peg$parsenum10() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseprefix10();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecomplex10();
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c163(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c191); }
      }

      return s0;
    }

    function peg$parsecomplex10() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parsereal10();
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 64) {
          s2 = peg$c74;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c75); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsereal10();
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c164(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseinfinity();
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 105) {
            s2 = peg$c165;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c166); }
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c167(s1);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parsereal10();
          if (s1 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 43) {
              s2 = peg$c168;
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c169); }
            }
            if (s2 !== peg$FAILED) {
              s3 = peg$parseureal10();
              if (s3 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 105) {
                  s4 = peg$c165;
                  peg$currPos++;
                } else {
                  s4 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c166); }
                }
                if (s4 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c170(s1, s3);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parsereal10();
            if (s1 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 45) {
                s2 = peg$c171;
                peg$currPos++;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c172); }
              }
              if (s2 !== peg$FAILED) {
                s3 = peg$parseureal10();
                if (s3 !== peg$FAILED) {
                  if (input.charCodeAt(peg$currPos) === 105) {
                    s4 = peg$c165;
                    peg$currPos++;
                  } else {
                    s4 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c166); }
                  }
                  if (s4 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c173(s1, s3);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              s1 = peg$parsereal10();
              if (s1 !== peg$FAILED) {
                s2 = peg$parseinfinity();
                if (s2 !== peg$FAILED) {
                  if (input.charCodeAt(peg$currPos) === 105) {
                    s3 = peg$c165;
                    peg$currPos++;
                  } else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c166); }
                  }
                  if (s3 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c170(s1, s2);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
              if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                s1 = peg$parsereal10();
                if (s1 !== peg$FAILED) {
                  if (input.substr(peg$currPos, 2) === peg$c174) {
                    s2 = peg$c174;
                    peg$currPos += 2;
                  } else {
                    s2 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c175); }
                  }
                  if (s2 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c176(s1);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
                if (s0 === peg$FAILED) {
                  s0 = peg$currPos;
                  s1 = peg$parsereal10();
                  if (s1 !== peg$FAILED) {
                    if (input.substr(peg$currPos, 2) === peg$c177) {
                      s2 = peg$c177;
                      peg$currPos += 2;
                    } else {
                      s2 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c178); }
                    }
                    if (s2 !== peg$FAILED) {
                      peg$reportedPos = s0;
                      s1 = peg$c179(s1);
                      s0 = s1;
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c0;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                  if (s0 === peg$FAILED) {
                    s0 = peg$currPos;
                    if (input.charCodeAt(peg$currPos) === 43) {
                      s1 = peg$c168;
                      peg$currPos++;
                    } else {
                      s1 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c169); }
                    }
                    if (s1 !== peg$FAILED) {
                      s2 = peg$parseureal10();
                      if (s2 !== peg$FAILED) {
                        if (input.charCodeAt(peg$currPos) === 105) {
                          s3 = peg$c165;
                          peg$currPos++;
                        } else {
                          s3 = peg$FAILED;
                          if (peg$silentFails === 0) { peg$fail(peg$c166); }
                        }
                        if (s3 !== peg$FAILED) {
                          peg$reportedPos = s0;
                          s1 = peg$c167(s2);
                          s0 = s1;
                        } else {
                          peg$currPos = s0;
                          s0 = peg$c0;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$c0;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c0;
                    }
                    if (s0 === peg$FAILED) {
                      s0 = peg$currPos;
                      if (input.charCodeAt(peg$currPos) === 45) {
                        s1 = peg$c171;
                        peg$currPos++;
                      } else {
                        s1 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c172); }
                      }
                      if (s1 !== peg$FAILED) {
                        s2 = peg$parseureal10();
                        if (s2 !== peg$FAILED) {
                          if (input.charCodeAt(peg$currPos) === 105) {
                            s3 = peg$c165;
                            peg$currPos++;
                          } else {
                            s3 = peg$FAILED;
                            if (peg$silentFails === 0) { peg$fail(peg$c166); }
                          }
                          if (s3 !== peg$FAILED) {
                            peg$reportedPos = s0;
                            s1 = peg$c180(s2);
                            s0 = s1;
                          } else {
                            peg$currPos = s0;
                            s0 = peg$c0;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$c0;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$c0;
                      }
                      if (s0 === peg$FAILED) {
                        s0 = peg$currPos;
                        s1 = peg$parsereal10();
                        if (s1 !== peg$FAILED) {
                          peg$reportedPos = s0;
                          s1 = peg$c181(s1);
                        }
                        s0 = s1;
                        if (s0 === peg$FAILED) {
                          s0 = peg$currPos;
                          if (input.substr(peg$currPos, 2) === peg$c174) {
                            s1 = peg$c174;
                            peg$currPos += 2;
                          } else {
                            s1 = peg$FAILED;
                            if (peg$silentFails === 0) { peg$fail(peg$c175); }
                          }
                          if (s1 !== peg$FAILED) {
                            peg$reportedPos = s0;
                            s1 = peg$c182();
                          }
                          s0 = s1;
                          if (s0 === peg$FAILED) {
                            s0 = peg$currPos;
                            if (input.substr(peg$currPos, 2) === peg$c177) {
                              s1 = peg$c177;
                              peg$currPos += 2;
                            } else {
                              s1 = peg$FAILED;
                              if (peg$silentFails === 0) { peg$fail(peg$c178); }
                            }
                            if (s1 !== peg$FAILED) {
                              peg$reportedPos = s0;
                              s1 = peg$c183();
                            }
                            s0 = s1;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parsereal10() {
      var s0, s1, s2;

      s0 = peg$parseinfinity();
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parsesign();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseureal10();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c184(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      }

      return s0;
    }

    function peg$parseureal10() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseuinteger10();
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 47) {
          s2 = peg$c185;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c186); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseuinteger10();
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c187(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$parsedecimal10();
        if (s0 === peg$FAILED) {
          s0 = peg$parseuinteger10();
        }
      }

      return s0;
    }

    function peg$parsedecimal10() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 46) {
        s1 = peg$c15;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c16); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsedigit();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsedigit();
          }
        } else {
          s2 = peg$c0;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsesuffix();
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c192(s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parsedigit();
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$parsedigit();
          }
        } else {
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 46) {
            s2 = peg$c15;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c16); }
          }
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parsedigit();
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parsedigit();
            }
            if (s3 !== peg$FAILED) {
              s4 = peg$parsesuffix();
              if (s4 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c193(s1, s3, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parseuinteger10();
          if (s1 !== peg$FAILED) {
            s2 = peg$parsesuffix();
            if (s2 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c194(s1, s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        }
      }

      return s0;
    }

    function peg$parsesuffix() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseexponentMarker();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesign();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parsedigit();
          if (s4 !== peg$FAILED) {
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parsedigit();
            }
          } else {
            s3 = peg$c0;
          }
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c195(s1, s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$parseempty();
      }

      return s0;
    }

    function peg$parseexponentMarker() {
      var s0;

      if (peg$c196.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c197); }
      }

      return s0;
    }

    function peg$parseuinteger10() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parsedigit();
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parsedigit();
        }
      } else {
        s1 = peg$c0;
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c198(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseprefix10() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseradix10();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseexactness();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseexactness();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseradix10();
          if (s2 !== peg$FAILED) {
            s1 = [s1, s2];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      }

      return s0;
    }

    function peg$parsenum16() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseprefix16();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecomplex16();
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c163(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c199); }
      }

      return s0;
    }

    function peg$parsecomplex16() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parsereal16();
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 64) {
          s2 = peg$c74;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c75); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsereal16();
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c200(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseinfinity();
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 105) {
            s2 = peg$c165;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c166); }
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c167(s1);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parsereal16();
          if (s1 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 43) {
              s2 = peg$c168;
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c169); }
            }
            if (s2 !== peg$FAILED) {
              s3 = peg$parseureal16();
              if (s3 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 105) {
                  s4 = peg$c165;
                  peg$currPos++;
                } else {
                  s4 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c166); }
                }
                if (s4 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c170(s1, s3);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parsereal16();
            if (s1 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 45) {
                s2 = peg$c171;
                peg$currPos++;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c172); }
              }
              if (s2 !== peg$FAILED) {
                s3 = peg$parseureal16();
                if (s3 !== peg$FAILED) {
                  if (input.charCodeAt(peg$currPos) === 105) {
                    s4 = peg$c165;
                    peg$currPos++;
                  } else {
                    s4 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c166); }
                  }
                  if (s4 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c173(s1, s3);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              s1 = peg$parsereal16();
              if (s1 !== peg$FAILED) {
                s2 = peg$parseinfinity();
                if (s2 !== peg$FAILED) {
                  if (input.charCodeAt(peg$currPos) === 105) {
                    s3 = peg$c165;
                    peg$currPos++;
                  } else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c166); }
                  }
                  if (s3 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c170(s1, s2);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
              if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                s1 = peg$parsereal16();
                if (s1 !== peg$FAILED) {
                  if (input.substr(peg$currPos, 2) === peg$c174) {
                    s2 = peg$c174;
                    peg$currPos += 2;
                  } else {
                    s2 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c175); }
                  }
                  if (s2 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c176(s1);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
                if (s0 === peg$FAILED) {
                  s0 = peg$currPos;
                  s1 = peg$parsereal16();
                  if (s1 !== peg$FAILED) {
                    if (input.substr(peg$currPos, 2) === peg$c177) {
                      s2 = peg$c177;
                      peg$currPos += 2;
                    } else {
                      s2 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c178); }
                    }
                    if (s2 !== peg$FAILED) {
                      peg$reportedPos = s0;
                      s1 = peg$c179(s1);
                      s0 = s1;
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c0;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                  if (s0 === peg$FAILED) {
                    s0 = peg$currPos;
                    if (input.charCodeAt(peg$currPos) === 43) {
                      s1 = peg$c168;
                      peg$currPos++;
                    } else {
                      s1 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c169); }
                    }
                    if (s1 !== peg$FAILED) {
                      s2 = peg$parseureal16();
                      if (s2 !== peg$FAILED) {
                        if (input.charCodeAt(peg$currPos) === 105) {
                          s3 = peg$c165;
                          peg$currPos++;
                        } else {
                          s3 = peg$FAILED;
                          if (peg$silentFails === 0) { peg$fail(peg$c166); }
                        }
                        if (s3 !== peg$FAILED) {
                          peg$reportedPos = s0;
                          s1 = peg$c167(s2);
                          s0 = s1;
                        } else {
                          peg$currPos = s0;
                          s0 = peg$c0;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$c0;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c0;
                    }
                    if (s0 === peg$FAILED) {
                      s0 = peg$currPos;
                      if (input.charCodeAt(peg$currPos) === 45) {
                        s1 = peg$c171;
                        peg$currPos++;
                      } else {
                        s1 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c172); }
                      }
                      if (s1 !== peg$FAILED) {
                        s2 = peg$parseureal16();
                        if (s2 !== peg$FAILED) {
                          if (input.charCodeAt(peg$currPos) === 105) {
                            s3 = peg$c165;
                            peg$currPos++;
                          } else {
                            s3 = peg$FAILED;
                            if (peg$silentFails === 0) { peg$fail(peg$c166); }
                          }
                          if (s3 !== peg$FAILED) {
                            peg$reportedPos = s0;
                            s1 = peg$c180(s2);
                            s0 = s1;
                          } else {
                            peg$currPos = s0;
                            s0 = peg$c0;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$c0;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$c0;
                      }
                      if (s0 === peg$FAILED) {
                        s0 = peg$currPos;
                        s1 = peg$parsereal16();
                        if (s1 !== peg$FAILED) {
                          peg$reportedPos = s0;
                          s1 = peg$c181(s1);
                        }
                        s0 = s1;
                        if (s0 === peg$FAILED) {
                          s0 = peg$currPos;
                          if (input.substr(peg$currPos, 2) === peg$c174) {
                            s1 = peg$c174;
                            peg$currPos += 2;
                          } else {
                            s1 = peg$FAILED;
                            if (peg$silentFails === 0) { peg$fail(peg$c175); }
                          }
                          if (s1 !== peg$FAILED) {
                            peg$reportedPos = s0;
                            s1 = peg$c182();
                          }
                          s0 = s1;
                          if (s0 === peg$FAILED) {
                            s0 = peg$currPos;
                            if (input.substr(peg$currPos, 2) === peg$c177) {
                              s1 = peg$c177;
                              peg$currPos += 2;
                            } else {
                              s1 = peg$FAILED;
                              if (peg$silentFails === 0) { peg$fail(peg$c178); }
                            }
                            if (s1 !== peg$FAILED) {
                              peg$reportedPos = s0;
                              s1 = peg$c183();
                            }
                            s0 = s1;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parsereal16() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parsesign();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseureal16();
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c184(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$parseinfinity();
      }

      return s0;
    }

    function peg$parseureal16() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseuinteger16();
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 47) {
          s2 = peg$c185;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c186); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseuinteger16();
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c187(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$parseuinteger16();
      }

      return s0;
    }

    function peg$parseuinteger16() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parsedigit16();
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parsedigit16();
        }
      } else {
        s1 = peg$c0;
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c201(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseprefix16() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseradix16();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseexactness();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseexactness();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseradix16();
          if (s2 !== peg$FAILED) {
            s1 = [s1, s2];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      }

      return s0;
    }

    function peg$parseinfinity() {
      var s0, s1;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c202) {
        s1 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c203); }
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c204();
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 6).toLowerCase() === peg$c205) {
          s1 = input.substr(peg$currPos, 6);
          peg$currPos += 6;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c206); }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c207();
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.substr(peg$currPos, 6).toLowerCase() === peg$c208) {
            s1 = input.substr(peg$currPos, 6);
            peg$currPos += 6;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c209); }
          }
          if (s1 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c210();
          }
          s0 = s1;
        }
      }

      return s0;
    }

    function peg$parsesign() {
      var s0;

      if (peg$c63.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c64); }
      }
      if (s0 === peg$FAILED) {
        s0 = peg$c41;
      }

      return s0;
    }

    function peg$parseexactness() {
      var s0;

      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c211) {
        s0 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c212); }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 2).toLowerCase() === peg$c213) {
          s0 = input.substr(peg$currPos, 2);
          peg$currPos += 2;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c214); }
        }
        if (s0 === peg$FAILED) {
          s0 = peg$parseempty();
        }
      }

      return s0;
    }

    function peg$parseradix2() {
      var s0;

      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c215) {
        s0 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c216); }
      }

      return s0;
    }

    function peg$parseradix8() {
      var s0;

      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c217) {
        s0 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c218); }
      }

      return s0;
    }

    function peg$parseradix10() {
      var s0;

      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c219) {
        s0 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c220); }
      }
      if (s0 === peg$FAILED) {
        s0 = peg$c41;
      }

      return s0;
    }

    function peg$parseradix16() {
      var s0;

      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c221) {
        s0 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c222); }
      }

      return s0;
    }

    function peg$parsedigit2() {
      var s0;

      if (peg$c223.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c224); }
      }

      return s0;
    }

    function peg$parsedigit8() {
      var s0;

      if (peg$c225.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c226); }
      }

      return s0;
    }

    function peg$parsedigit16() {
      var s0;

      s0 = peg$parsedigit();
      if (s0 === peg$FAILED) {
        if (peg$c227.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c228); }
        }
      }

      return s0;
    }

    function peg$parseempty() {
      var s0;

      s0 = [];

      return s0;
    }


    var objects      = require('./objects');
    var Bool         = objects.Bool;
    var ByteVector   = objects.ByteVector;
    var Char         = objects.Char;
    var Complex      = objects.Complex;
    var Nil          = objects.Nil;
    var Pair         = objects.Pair;
    var Real         = objects.Real;
    var Str          = objects.Str;
    var Symbol       = objects.Symbol;
    var Vector       = objects.Vector;


    peg$result = peg$startRuleFunction();

    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
      return peg$result;
    } else {
      if (peg$result !== peg$FAILED && peg$currPos < input.length) {
        peg$fail({ type: "end", description: "end of input" });
      }

      throw peg$buildException(null, peg$maxFailExpected, peg$maxFailPos);
    }
  }

  return {
    SyntaxError: SyntaxError,
    parse:       parse
  };
})();

},{"./objects":6}],9:[function(require,module,exports){

function compile(expr) {
  switch (expr.type) {
    case 'set':
      return {
        type: 'set',
        id: expr.id,
        expr: compile(expr.expr)
      };
    case 'if':
      return {
        type: 'if',
        test: compile(expr.test),
        then: compile(expr.then),
        'else': compile(expr.else)
      };
    case 'define':
      return {
        type: 'define',
        id: expr.id,
        expr: compile(expr.expr)
      };
    case 'lambda':
      return {
        type: 'lambda',
        args: expr.args,
        variadic: expr.variadic,
        body: compile(expr.body)
      };
    case 'call':
      return compileCall(expr);
    case 'seq':
      return compileSeq(expr);
    case 'void':
      return expr;
  }

  return expr;
}


function compileSeq(expr) {
  var body = [];
  for (var i = 0; i < expr.body.length; ++i) {
    body.push(compile(expr.body[i]));
  }

  return {
    type: 'seq',
    body: body
  };
}


function compileCall(expr) {
  var proc = compile(expr.proc);
  var args = compileArgs(expr.args);

  return {
    type: 'call',
    proc: proc,
    args: args
  };
}


function compileArgs(args) {
  var ret = [];
  for (var i = 0; i < args.length; ++i) {
    ret.push(compile(args[i]));
  }

  return ret;
}


exports.compile = function (expr) {
  var a = compile(expr);
  //console.log(JSON.stringify(a, null, 4));
  return a;
};

},{}],10:[function(require,module,exports){
// compile the intermediate form into CPS.

function compile(expr, env, next) {
  switch (expr.type) {
    case 'ref':
      return compileLookup('ref', expr.id, env, next);
    case 'set':
      return compile(expr.expr,
                     env,
                     compileLookup('set', expr.id, env, next));
    case 'const':
      return {
        type: 'const',
        value: expr.value,
        next: next
      };
    case 'if':
      return compile(expr.test, env, {
        type: 'test',
        then: compile(expr.then, env, next),
        'else': compile(expr.else, env, next),
      });
    case 'define':
      return compile(expr.expr, env, {
        type: 'define',
        id: expr.id,
        next: next
      });
    case 'lambda':
      return {
        type: 'close',
        nargs: expr.args.length,
        variadic: expr.variadic,
        body: compile(expr.body,
                      [expr.args].concat(env),
                      { type: 'return' }),
                      next: next
      };
    case 'call':
      return compileCall(expr, env, next);
    case 'seq':
      return compileSeq(expr, env, next);
    case 'void':
      return next;
  }
}


function compileLookup(type, sym, env, next) {
  for (var depth = 0; depth < env.length; ++depth) {
    var rib = env[depth];
    for (var offset = 0; offset < rib.length; ++offset) {
      if (rib[offset] === sym) {
        return {
          type: 'l' + type,
          depth: depth,
          offset: offset,
          next: next
        };
      }
    }
  }

  return {
    type: 'g' + type,
    id: sym,
    index: -1,
    next: next
  };
}


function compileCall(expr, env, next) {
  var proc = expr.proc;
  var args = expr.args;

  var ret = compile(proc, env, { type: 'apply' });

  for (var i = args.length - 1; i >= 0; --i) {
    ret = compile(args[i], env, {
      type: 'arg',
      i: i,
      next: ret
    });
  }

  var isTail = next.type === 'return';
  return isTail ? ret : {
    type: 'frame',
    nargs: args.length,
    ret: next,
    next: ret
  };
}


function compileSeq(expr, env, next) {
  var body = expr.body;

  for (var i = body.length - 1; i >= 0; --i) {
    next = compile(body[i], env, next);
  }

  return next;
}


exports.compile = function (expr) {
  return compile(expr, [], { type: 'halt' });
};

},{}],11:[function(require,module,exports){
function Bool(value) {
  // if Bool.True and Bool.False are already defined,
  // then return the corresponding instance.
  if (value && Bool.True) {
    return Bool.True;
  } else if (!value && Bool.False) {
    return Bool.False;
  } else {
    this.value = value;
  }
}

Bool.True = new Bool(true);
Bool.False = new Bool(false);

Bool.prototype.type = 'bool';

Bool.prototype.display = function () {
  return this.value ? '#t' : '#f';
};

Bool.prototype.toJSON = function () {
  return {
    type: this.type,
    value: this.value
  };
};

module.exports = Bool;

},{}],12:[function(require,module,exports){
function ByteVector(bytes) {
  this.bytes = bytes;
}

ByteVector.prototype.type = 'bytevector';

ByteVector.prototype.toJSON = function () {
  return {
    type: this.type,
    bytes: this.bytes
  };
};

module.exports = ByteVector;

},{}],13:[function(require,module,exports){
function Char(value) {
  this.value = value;
}

Char.prototype.type = 'char';

Char.prototype.toJSON = function () {
  return {
    type: this.type,
    value: this.value
  };
};

module.exports = Char;

},{}],14:[function(require,module,exports){
function Complex(real, imag) {
  this.real = real; this.imag = imag;
}

Complex.prototype.type = 'complex';

Complex.prototype.toJSON = function () {
  return {
    type: 'complex',
    real: this.real,
    imag: this.imag
  };
};

module.exports = Complex;

},{}],15:[function(require,module,exports){
var Nil = {};

Nil.type = 'nil';

Nil.length = function () {
  return 0;
};

Nil.toArray = function () {
  return [];
};

Nil.isProperList = function () {
  return true;
};

Nil.display = function () {
  return '()';
};

Nil.toJSON = function () {
  return {
    type: Nil.type
  };
};


module.exports = Nil;

},{}],19:[function(require,module,exports){
// Since `String` is a builtin type in ECMAScript, so we use `Str` instead.
function Str(value) {
  this.value = value;
}

Str.prototype.type = 'string';

Str.prototype.toJSON = function () {
  return {
    type: this.type,
    value: this.value
  };
};

Str.prototype.display = function () {
  return '"' + this.value + '"';
};

module.exports = Str;

},{}],18:[function(require,module,exports){
function Symbol(name) {
  // make sure that there is exactly one copy for each symbol
  if (Object.prototype.hasOwnProperty.call(Symbol.symbols, name)) {
    return Symbol.symbols[name];
  } else {
    this.name = name;
    Symbol.symbols[name] = this;
  }
}

Symbol.symbols = {}; // allocated symbols

Symbol.prototype.type = 'symbol';

Symbol.prototype.toJSON = function () {
  return {
    type: this.type,
    name: this.name
  };
};

Symbol.prototype.display = function () {
  return '\'' + this.name;
};

module.exports = Symbol;

},{}],20:[function(require,module,exports){
function Vector(elements) {
  this.elements = elements;
}

Vector.make = function (n) {
  return new Vector(new Array(n));
};

Vector.makeWithFill = function (n, fill) {
  var elements = new Array(n);

  for (var i = 0; i < n; ++i) {
    elements[i] = fill;
  }

  return new Vector(elements);
};

Vector.prototype.type = 'vector';

Vector.prototype.getLength = function () {
  return this.elements.length;
};

Vector.prototype.ref = function (i) {
  // TODO: throw error on invalid index
  return this.elements[i];
};

Vector.prototype.set = function (i, v) {
  // TODO: throw error on invalid index
  this.elements[i] = v;
};

Vector.prototype.toJSON = function () {
  return {
    type: this.type,
    elements: this.elements
  };
};

module.exports = Vector;

},{}],22:[function(require,module,exports){
function Syntax(name) {
  // make sure that there is exactly one copy for each syntax
  if (Object.hasOwnProperty.call(Syntax.syntaxes, name)) {
    return Syntax.syntaxes[name];
  } else {
    this.name = name;
    Syntax.syntaxes[name] = this;
  }
}

Syntax.syntaxes = {}; // allocated syntaxes

Syntax.prototype.type = 'syntax';

Syntax.prototype.display = function () {
  return '#<syntax ' + this.name + '>';
};

module.exports = Syntax;

},{}],21:[function(require,module,exports){
function Closure(body, env, numArgs, isVariadic) {
  this.body = body;
  this.env = env;
  this.numArgs = numArgs;
  this.isVariadic = isVariadic;
}

Closure.prototype.display = function () {
  if (this.body.type === 'nuate') {
    return '#<continuation>';
  }
  return '#<closure>';
};

Closure.prototype.type = 'closure';

module.exports = Closure;

},{}],16:[function(require,module,exports){
var Nil = require('./nil');


/**
 * @class
 */
function Pair(car, cdr) {
  this.car = car;
  this.cdr = cdr;
}


/**
 * @static
 * @function
 * @param {Array} array
 * @return {Pair}
 */
Pair.makeList = function (array) {
  var list = Nil;
  for (var i = array.length - 1; i >= 0; --i) {
    list = new Pair(array[i], list);
  }
  return list;
};


/**
 * @property {String} type
 */
Pair.prototype.type = 'pair';


/**
 * @function
 * @return {Array}
 */
Pair.prototype.toArray = function () {
  var array = [], pair = this;
  for (; pair.type === 'pair'; pair = pair.cdr) {
    array.push(pair.car);
  }
  if (pair !== Nil) {
    array.push(pair);
  }
  return array;
};


/**
 * Compute and return the length of the list (assuming it's a proper list).
 * @function
 * @return {Number}
 */
Pair.prototype.getLength = function () {
  var len = 0, pair = this;
  for (; pair.type === 'pair'; pair = pair.cdr) {
    len += 1;
  }
  if (pair !== Nil) {
    len += 1;
  }
  return len;
};


/**
 * Convert the list to a proper list.
 * (x y . z) -> (x y z)
 * @function
 * @return {Pair}
 */
Pair.prototype.toProperList = function () {
  var pair = this;
  var list = Nil;
  for (; pair.type === 'pair'; pair = pair.cdr) {
    list = new Pair(pair.car, list);
  }
  if (pair === Nil) {
    return list.reverse();
  } else {
    list = new Pair(pair, list);
    return list.reverse();
  }
};


/**
 * @function
 * @return {Number}
 */
Pair.prototype.getDotPosition = function () {
  var pos = 0;
  var pair = this;
  while (pair.type === 'pair') {
    pos += 1;
    pair = pair.cdr;
  }
  if (pair === Nil) {
    return pos;
  } else {
    return -1;
  }
};


/**
 * Determine whether the pair is a proper list.
 * @function
 * @return {Boolean}
 */
Pair.prototype.isProperList = function () {
  var pair = this;
  while (pair.type === 'pair') {
    pair = pair.cdr;
  }
  return pair === Nil;
};


/**
 * Return the reversed list.
 * @function
 * @return {Pair}
 */
Pair.prototype.reverse = function () {
  var ret = Nil;
  var pair = this;
  for (; pair.type === 'pair'; pair = pair.cdr) {
    ret = new Pair(pair.car, ret);
  }
  return ret;
};

Pair.prototype.display = function () {
  var strs = [], pair = this;

  strs.push('(');

  // push all the elements in the list except the last one
  for (; pair.type === 'pair'; pair = pair.cdr) {
    strs.push(pair.car.display());
    strs.push(' ');
  }

  // after the for loop, `pair' now points to the last element in
  // the list.
  // if the last element is Nil, then the list is a proper list,
  // and we discard the excessive space.
  // else, the list is inproper, and we insert an dot before the 
  // last element.
  if (pair === Nil) {
    strs.pop();
  } else {
    strs.push('. ');
    strs.push(pair.display());
  }

  strs.push(')');

  return strs.join('');
};

Pair.prototype.append = function (x) {
  var array = this.toArray();
  array.push(x);
  return Pair.makeList(array);
};


/**
 * @function
 * @return {Object}
 */
Pair.prototype.toJSON = function () {
  return {
    type: this.type,
    car: this.car.toJSON(),
    cdr: this.cdr.toJSON()
  };
};


module.exports = Pair;

},{"./nil":15}],17:[function(require,module,exports){
var Bool = require('./bool');

function Real(value) {
  this.value = value;
}

Real.prototype.toJSON = function () {
  return {
    type: 'real',
    value: this.value
  };
};

Real.prototype.add = function (other) {
  return new Real(this.value + other.value);
};

Real.prototype.sub = function (other) {
  return new Real(this.value - other.value);
};

Real.prototype.mul = function (other) {
  return new Real(this.value * other.value);
};

Real.prototype.div = function (other) {
  return new Real(this.value / other.value);
};

Real.prototype.neg = function () {
  return new Real(-this.value);
};

Real.prototype.eql = function (other) {
  return new Bool(this.value === other.value);
};

Real.prototype.lt = function (other) {
  return new Bool(this.value < other.value);
};

Real.prototype.le = function (other) {
  return new Bool(this.value <= other.value);
};

Real.prototype.gt = function (other) {
  return new Bool(this.value > other.value);
};

Real.prototype.ge = function (other) {
  return new Bool(this.value >= other.value);
};

Real.prototype.display = function () {
  if (this.value === Infinity) {
    return '+inf.0';
  }
  if (this.value === -Infinity) {
    return '-inf.0';
  }
  if (isNaN(this.value)) {
    return '+nan.0';
  }
  return String(this.value);
};

module.exports = Real;

},{"./bool":11}],7:[function(require,module,exports){
var objects     = require('./objects');
var Pair        = objects.Pair;
var Bool        = objects.Bool;
var Nil         = objects.Nil;
var Symbol      = objects.Symbol;
var Environment = require('./environment');

var environment = new Environment();

function define(bindings) {
  var name, value;
  for (name in bindings) {
    value = bindings[name];
    value.type = '';
    environment.define(new Symbol(name), value);
  }
}

define({
  '+': function (args) {
    return args[0].add(args[1]);
  },
  '-': function (args) {
    return args[0].sub(args[1]);
  },
  '*': function (args) {
    return args[0].mul(args[1]);
  }, 
  '/': function (args) {
    return args[0].div(args[1]);
  },
  '=': function (args) {
    return args[0].eql(args[1]);
  },
  '<': function (args) {
    return args[0].lt(args[1]);
  },
  '>': function (args) {
    return args[0].gt(args[1]);
  },
  'display': function (args) {
    console.log(args[0].display());
  },
  'cons': function (args) {
    return new Pair(args[0], args[1]);
  },
  'car': function (args) {
    return args[0].car;
  },
  'cdr': function (args) {
    return args[0].cdr;
  },
  'null?': function (args) {
    return new Bool(args[0] === Nil);
  },
  'append': function (args) {
    if (args[0] === Nil) {
      return new Pair(args[1], Nil);
    }
    return args[0].append(args[1]);
  }
});

module.exports = environment;

},{"./environment":5,"./objects":6}],8:[function(require,module,exports){
/**
 * @fileoverview This pass compiles the s-expression into the 
 *   tree intermediate form, which is composed of the following nodes:
 *
 *   ref:
 *     id: Symbol
 *
 *   set:
 *     id: Symbol
 *     expr: IForm
 *
 *   const:
 *     value: *
 *
 *   if:
 *     test: IForm
 *     then: IForm
 *     else: IForm
 *
 *   define:
 *     id: Symbol
 *     expr: IForm
 *
 *   lambda:
 *     args: [Symbol]
 *     variadic: Boolean
 *     body: IForm
 *
 *   call:
 *     proc: IForm
 *     args: [IForm]
 *
 *   seq:
 *     body: [IForm]
 *
 *   let:
 *     ids: [Symbol]
 *     values: [IForm]
 *     body: IForm
 *
 *   letrec:
 *     sequential: Boolean
 *     ids: [Symbol]
 *     values: [IForm]
 *     body: IForm
 *
 *   void:
 *     
 *     
 *   During this pass, several transformations are performed, including:
 *
 *     1. transform (define (f x) ...) into (define f (lambda (x) ...))
 */

var objects     = require('../objects');
var Pair        = objects.Pair;
var Symbol      = objects.Symbol;
var Syntax      = objects.Syntax;
var Nil         = objects.Nil;
var Environment = require('../environment');


/**
 * @param {Object} expr
 * @param {Environment} env
 * @return {Object}
 */
function compile(expr, env) {
  if (expr.type === 'symbol') {
    return {
      type: 'ref',
      id: expr
    };
  }

  if (expr.type !== 'pair') {
    return {
      type: 'const',
      value: expr
    };
  }

  // now expr is a pair, which has the form: (head args*)
  var head = expr.car;
  var operator = env.lookupBySymbol(head);

  if (operator === null || operator.type !== 'syntax') {
    return compileCall(expr, env);
  }

  // operator is a builtin syntax
  switch (operator.name) {
    case 'quote':
      return {
        type: 'const',
        value: expr.cdr.car
      };
    case 'define':
      return compileDefine(expr, env);
    case 'lambda':
      return compileLambda(expr, env);
    case 'set!':
      return {
        type: 'set',
        id: expr.cdr.car,
        expr: compile(expr.cdr.cdr.car, env)
      };
    case 'begin':
      return compileBegin(expr, env);
    case 'if':
      return {
        type: 'if',
        test: compile(expr.cdr.car, env),
        then: compile(expr.cdr.cdr.car, env),
        'else': compile(expr.cdr.cdr.cdr.car, env)
      };
    case 'let':
      return compileLet(expr, env);
    case 'letrec':
      return compileLetrec(expr, env);
    default:
      throw new Error('should not reach here');
  }
}


function compileDefine(expr, env) {
  expr = normalizeDefine(expr);

  return {
    type: 'define',
    id: expr.cdr.car,
    expr: compile(expr.cdr.cdr.car, env)
  };
}

function compileLambda(expr, env) {
  // expr is like
  // (lambda (<formals>) <body>)
  // (lambda <formal> <body>)
  var args = expr.cdr.car;
  
  // define the formals in the environment
  var newEnv = new Environment(env);
  for (var i = 0, len = args.length; i < len; ++i) {
    newEnv.define(args[i], args[i]);
  }

  var body = compileBody(expr.cdr.cdr, newEnv);

  if (args.type === 'symbol') {
    return {
      type: 'lambda',
      args: [args],
      variadic: true,
      body: body
    };
  }

  // args.type is 'pair'
  return {
    type: 'lambda',
    args: args.toArray(),
    variadic: !args.isProperList(),
    body: body
  };
}

function normalizeDefine(expr) {
  // R7RS Section 5.3
  // (define <id> <expression>)
  // (define (<id> <formals>) <body>)
  //   => (define <id>
  //        (lambda (<formals>) <body>))
  // (define (<id> . <formal>) <body>)
  //   => (define <id>
  //        (lambda <formal> <body>))
  var second = expr.cdr.car;
  if (second.type === 'symbol') {
    return expr;
  }

  // second.type === 'pair'
  var id = second.car;
  var formals = second.cdr;
  var body = expr.cdr.cdr;
  var lambda = new Pair(new Symbol('lambda'),
                        new Pair(formals,
                                 body));
  return Pair.makeList([
    new Symbol('define'),
    id,
    lambda
  ]);
}

//function transformInternalDefinitions(exprs, env) {
  //var bindings = [];

  //for (; exprs !== Nil; exprs = exprs.cdr) {
    //var expr = exprs.car;
    //var head = env.lookupBySymbol(expr.car);

    //// check for internal definitions
    //if (head && head.type === 'syntax' && head.name === 'define') {
      //var define = normalizeDefine(expr);
      //var id = define.cdr.car;
      //var value = define.cdr.cdr.car;
      //bindings.push(Pair.makeList([id, value]));
    //} else {
      //break;
    //}
  //}

  
  //return Pair.makeList([
    //new Symbol('letrec*'),
    //Pair.makeList(bindings),
    //exprs
  //]);
//}

function compileBody(exprs, env) {
  var body = [];

  for (; exprs !== Nil; exprs = exprs.cdr) {
    body.push(compile(exprs.car, env));
  }

  if (body.length > 1) {
    return {
      type: 'seq',
      body: body
    };
  } 
  return body[0];
}

function compileBegin(expr, env) {
  var body = [];
  for (expr = expr.cdr; expr !== Nil; expr = expr.cdr) {
    body.push(compile(expr.car, env));
  }
  if (body.length > 1) {
    return {
      type: 'seq',
      body: body
    };
  }
  return body[0];
}

function compileCall(expr, env) {
  var proc = compile(expr.car, env);

  var args = expr.cdr.toArray();
  for (var i = 0; i < args.length; ++i) {
    args[i] = compile(args[i], env);
  }

  return {
    type: 'call',
    proc: proc,
    args: args
  };
}

function compileLet(expr, env) {
  // (let ((<id> <value>)
  //       (<id> <value>))
  //   <body>)
  var bindings = expr.cdr.car.toArray();
  var ids = [];
  var values = [];
  var newEnv = new Environment(env);

  for (var i = 0, len = bindings.length; i < len; ++i) {
    var binding = bindings[i];
    var id = binding.car;
    var value = binding.cdr.car;

    ids.push(id);
    values.push(compile(value, env));
  
    newEnv.define(id, id);
  }

  return {
    type: 'let',
    ids: ids,
    values: values,
    body: compileBody(expr.cdr.cdr, newEnv)
  };
}

function compileLetrec(expr, env) {
  // (letrec ((<id> <value>)
  //          (<id> <value>))
  //   <body>)
  var bindings = expr.cdr.car.toArray();
  var ids = [];
  var values = [];
  var newEnv = new Environment(env);

  for (var i = 0, len = bindings.length; i < len; ++i) {
    var binding = bindings[i];
    var id = binding.car;
    ids.push(id);
    newEnv.define(id, id);
  }

  for (i = 0, len = bindings.length; i < len; ++i) {
    var binding = bindings[i];
    var value = binding.cdr.car;
    values.push(compile(value, newEnv));
  }

  return {
    type: 'letrec',
    sequential: false,
    ids: ids,
    values: values,
    body: compileBody(expr.cdr.cdr, newEnv)
  };
}


/**
 * The main entry point of the compilation.
 * @param {Array.<Object>} exprs An array of s-expressions
 * @return {Object} The tree intermediate form
 */
exports.compile = function (exprs) {
  var env = new Environment();
  env.define(new Symbol('quote')  , new Syntax('quote'));
  env.define(new Symbol('define') , new Syntax('define'));
  env.define(new Symbol('if')     , new Syntax('if'));
  env.define(new Symbol('lambda') , new Syntax('lambda'));
  env.define(new Symbol('set!')   , new Syntax('set!'));
  env.define(new Symbol('begin')  , new Syntax('begin'));
  env.define(new Symbol('let')    , new Syntax('let'));
  env.define(new Symbol('letrec') , new Syntax('letrec'));

  var body = [];
  for (var i = 0; i < exprs.length; ++i) {
    body.push(compile(exprs[i], env));
  }
  console.log(JSON.stringify(body, null, 4));

  switch (body.length) {
    case 0:
      return { type: 'void' };
    case 1:
      return body[0];
    default:
      return { type: 'seq', body: body };
  }
};


},{"../environment":5,"../objects":6}]},{},[1])(1)
});
;