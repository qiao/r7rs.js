/// <reference path="./parser.d.ts" />

import parser = require('./parser');
import Bool = require('./objects/bool');
import ByteVector = require('./objects/bytevector');
import Char = require('./objects/char');
import Complex = require('./objects/complex');
import NIL = require('./objects/nil');
import Pair = require('./objects/pair');
import Real = require('./objects/real');
import Str = require('./objects/str');
import Symbol = require('./objects/symbol');
import Syntax = require('./objects/syntax');
import Vector = require('./objects/vector');

export const objects = {
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

export const parse = parser.parse;
