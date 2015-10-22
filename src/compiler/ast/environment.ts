import IObject = require('../../objects/iobject');
import Symbol = require('../../objects/symbol');
import Syntax = require('./syntax');
import Var = require('./var');

type ValueType = (Syntax|Var);

class Environment {

  private parent: Environment;
  private bindings: { [key: string]: ValueType };

  constructor(parent?: Environment) {
    this.parent = parent;
    this.bindings = {};
  }

  lookup(symbol: Symbol): ValueType {
    const name = symbol.name;
    if (Object.prototype.hasOwnProperty.call(this.bindings, name)) {
      return this.bindings[name];
    }

    if (this.parent) {
      const value = this.parent.lookup(symbol);
      if (value) {
        return value;
      }
    }

    return null;
  }

  define(symbol: Symbol, value: ValueType): void {
    this.bindings[symbol.name] = value;
  }
}

export = Environment;
