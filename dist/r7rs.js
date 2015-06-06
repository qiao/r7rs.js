(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.r7rs = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Bool = (function () {
    function Bool(value) {
        this.type = 0 /* BOOL */;
        if (value && Bool.TRUE) {
            return Bool.TRUE;
        }
        else if (!value && Bool.FALSE) {
            return Bool.FALSE;
        }
        else {
            this.value = value;
        }
    }
    Bool.prototype.toJSON = function () {
        return {
            type: this.type,
            value: this.value
        };
    };
    Bool.prototype.display = function () {
        return this.value ? '#t' : '#f';
    };
    Bool.TRUE = new Bool(true);
    Bool.FALSE = new Bool(false);
    return Bool;
})();
module.exports = Bool;

},{}],2:[function(require,module,exports){
var ByteVector = (function () {
    function ByteVector(bytes) {
        this.type = 1 /* BYTE_VECTOR */;
        this.bytes = bytes;
    }
    ByteVector.prototype.toJSON = function () {
        return {
            type: this.type,
            bytes: this.bytes
        };
    };
    ByteVector.prototype.display = function () {
        return '#vu8(TODO)';
    };
    return ByteVector;
})();
module.exports = ByteVector;

},{}],3:[function(require,module,exports){
var Char = (function () {
    function Char(value) {
        this.type = 2 /* CHAR */;
        this.value = value;
    }
    Char.prototype.toJSON = function () {
        return {
            type: this.type,
            value: this.value
        };
    };
    Char.prototype.display = function () {
        return '\#' + this.value;
    };
    return Char;
})();
module.exports = Char;

},{}],4:[function(require,module,exports){
var Complex = (function () {
    function Complex(real, imag) {
        this.type = 3 /* COMPLEX */;
        this.real = real;
        this.imag = imag;
    }
    Complex.prototype.toJSON = function () {
        return {
            type: this.type,
            real: this.real,
            imag: this.imag
        };
    };
    Complex.prototype.display = function () {
        return '';
    };
    return Complex;
})();
module.exports = Complex;

},{}],5:[function(require,module,exports){
var Nil = (function () {
    function Nil() {
        this.type = 4 /* NIL */;
    }
    Nil.prototype.getLength = function () {
        return 0;
    };
    Nil.prototype.toArray = function () {
        return [];
    };
    Nil.prototype.isProperList = function () {
        return false;
    };
    Nil.prototype.display = function () {
        return '()';
    };
    Nil.prototype.toJSON = function () {
        return {
            type: this.type
        };
    };
    Nil.prototype.reverse = function () {
        return this;
    };
    return Nil;
})();
module.exports = new Nil();

},{}],6:[function(require,module,exports){
var NIL = require('./nil');
var Pair = (function () {
    function Pair(car, cdr) {
        this.type = 5 /* PAIR */;
        this.car = car;
        this.cdr = cdr;
    }
    Pair.fromArray = function (array) {
        var list = NIL;
        for (var i = array.length - 1; i >= 0; --i) {
            list = new Pair(array[i], list);
        }
        return list;
    };
    Pair.prototype.toArray = function () {
        var array = [];
        var pair = this;
        for (; pair.type === 5 /* PAIR */; pair = pair.cdr) {
            array.push(pair.car);
        }
        if (pair !== NIL) {
            array.push(pair);
        }
        return array;
    };
    Pair.prototype.isProperList = function () {
        var pair = this;
        for (; pair.type === 5 /* PAIR */; pair = pair.cdr) {
        }
        return pair === NIL;
    };
    ;
    Pair.prototype.getLength = function () {
        var len = 0;
        var pair = this;
        for (; pair.type === 5 /* PAIR */; pair = pair.cdr) {
            len += 1;
        }
        if (pair !== NIL) {
            len += 1;
        }
        return len;
    };
    /**
     * Convert the list to a proper list.
     * (x y . z) -> (x y z)
     */
    Pair.prototype.toProperList = function () {
        var pair = this;
        var list = NIL;
        for (; pair.type === 5 /* PAIR */; pair = pair.cdr) {
            list = new Pair(pair.car, list);
        }
        if (pair === NIL) {
            return list.reverse();
        }
        else {
            list = new Pair(pair, list);
            return list.reverse();
        }
    };
    Pair.prototype.getDotPosition = function () {
        var pos = 0;
        var pair = this;
        for (; pair.type === 5 /* PAIR */; pair = pair.cdr) {
            pos += 1;
        }
        if (pair === NIL) {
            return pos;
        }
        else {
            return -1;
        }
    };
    Pair.prototype.reverse = function () {
        var ret = NIL;
        var pair = this;
        for (; pair.type === 5 /* PAIR */; pair = pair.cdr) {
            ret = new Pair(pair.car, ret);
        }
        return ret;
    };
    Pair.prototype.append = function (x) {
        var array = this.toArray();
        array.push(x);
        return Pair.fromArray(array);
    };
    Pair.prototype.toJSON = function () {
        return {
            type: this.type,
            car: this.car.toJSON(),
            cdr: this.cdr.toJSON()
        };
    };
    Pair.prototype.display = function () {
        var strs = [];
        var pair = this;
        strs.push('(');
        // push all the elements in the list except the last one
        for (; pair.type === 5 /* PAIR */; pair = pair.cdr) {
            strs.push(pair.car.display());
            strs.push(' ');
        }
        // after the for loop, `pair' now points to the last element in
        // the list.
        // if the last element is NIL, then the list is a proper list,
        // and we discard the excessive space.
        // else, the list is inproper, and we insert an dot before the 
        // last element.
        if (pair === NIL) {
            strs.pop();
        }
        else {
            strs.push('. ');
            strs.push(pair.display());
        }
        strs.push(')');
        return strs.join('');
    };
    return Pair;
})();
module.exports = Pair;

},{"./nil":5}],7:[function(require,module,exports){
var Bool = require('./bool');
var Real = (function () {
    function Real(value) {
        this.type = 6 /* REAL */;
        this.value = value;
    }
    Real.prototype.toJSON = function () {
        return {
            type: this.type,
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
    ;
    Real.prototype.div = function (other) {
        return new Real(this.value / other.value);
    };
    ;
    Real.prototype.neg = function (other) {
        return new Real(-this.value);
    };
    Real.prototype.eql = function (other) {
        return new Bool(this.value === other.value);
    };
    Real.prototype.lt = function (other) {
        return new Bool(this.value < other.value);
    };
    ;
    Real.prototype.le = function (other) {
        return new Bool(this.value <= other.value);
    };
    ;
    Real.prototype.gt = function (other) {
        return new Bool(this.value > other.value);
    };
    ;
    Real.prototype.ge = function (other) {
        return new Bool(this.value >= other.value);
    };
    ;
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
    return Real;
})();
module.exports = Real;

},{"./bool":1}],8:[function(require,module,exports){
var Str = (function () {
    function Str(value) {
        this.type = 7 /* STR */;
        this.value = value;
    }
    Str.prototype.toJSON = function () {
        return {
            type: this.type,
            value: this.value
        };
    };
    Str.prototype.display = function () {
        return '"' + this.value + '"';
    };
    return Str;
})();
module.exports = Str;

},{}],9:[function(require,module,exports){
var Symbol = (function () {
    function Symbol(name) {
        this.type = 8 /* SYMBOL */;
        // make sure that there is exactly one copy for each symbol
        if (Object.prototype.hasOwnProperty.call(Symbol.symbols, name)) {
            return Symbol.symbols[name];
        }
        else {
            this.name = name;
            Symbol.symbols[name] = this;
        }
    }
    Symbol.prototype.toJSON = function () {
        return {
            type: this.type,
            name: this.name
        };
    };
    Symbol.prototype.display = function () {
        return '\'' + this.name;
    };
    Symbol.symbols = {};
    return Symbol;
})();
module.exports = Symbol;

},{}],10:[function(require,module,exports){
var Syntax = (function () {
    function Syntax(name) {
        this.type = 9 /* SYNTAX */;
        // make sure that there is exactly one copy for each syntax
        if (Object.prototype.hasOwnProperty.call(Syntax.syntaxes, name)) {
            return Syntax.syntaxes[name];
        }
        else {
            this.name = name;
            Syntax.syntaxes[name] = this;
        }
    }
    Syntax.prototype.toJSON = function () {
        return {
            type: this.type,
            name: this.name
        };
    };
    Syntax.prototype.display = function () {
        return '#<syntax ' + this.name + '>';
    };
    Syntax.syntaxes = {};
    return Syntax;
})();
module.exports = Syntax;

},{}],11:[function(require,module,exports){
var Vector = (function () {
    function Vector(elements) {
        this.type = 10 /* VECTOR */;
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
    Vector.prototype.display = function () {
        // TODO
        return '\'#()';
    };
    return Vector;
})();
module.exports = Vector;

},{}],12:[function(require,module,exports){
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
            return Pair.fromArray(ds);
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
              return new Pair(symbol, new Pair(d, NIL));
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


    var Bool         = require('./objects/bool');
    var ByteVector   = require('./objects/bytevector');
    var Char         = require('./objects/char');
    var Complex      = require('./objects/complex');
    var NIL          = require('./objects/nil');
    var Pair         = require('./objects/pair');
    var Real         = require('./objects/real');
    var Str          = require('./objects/str');
    var Symbol       = require('./objects/symbol');
    var Vector       = require('./objects/vector');


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
},{"./objects/bool":1,"./objects/bytevector":2,"./objects/char":3,"./objects/complex":4,"./objects/nil":5,"./objects/pair":6,"./objects/real":7,"./objects/str":8,"./objects/symbol":9,"./objects/vector":11}],13:[function(require,module,exports){
/// <reference path="./parser.d.ts" />
var parser = require('./parser');
var Bool = require('./objects/bool');
var ByteVector = require('./objects/bytevector');
var Char = require('./objects/char');
var Complex = require('./objects/complex');
var NIL = require('./objects/nil');
var Pair = require('./objects/pair');
var Real = require('./objects/real');
var Str = require('./objects/str');
var Symbol = require('./objects/symbol');
var Syntax = require('./objects/syntax');
var Vector = require('./objects/vector');
exports.objects = {
    Bool: Bool,
    ByteVector: ByteVector,
    Char: Char,
    Complex: Complex,
    NIL: NIL,
    Pair: Pair,
    Real: Real,
    Str: Str,
    Symbol: Symbol,
    Syntax: Syntax,
    Vector: Vector
};
exports.parse = parser.parse;

},{"./objects/bool":1,"./objects/bytevector":2,"./objects/char":3,"./objects/complex":4,"./objects/nil":5,"./objects/pair":6,"./objects/real":7,"./objects/str":8,"./objects/symbol":9,"./objects/syntax":10,"./objects/vector":11,"./parser":12}]},{},[13])(13)
});