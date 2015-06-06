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
