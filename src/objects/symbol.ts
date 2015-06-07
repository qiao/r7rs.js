import IObject = require('./iobject');
import Type = require('./type');

class Symbol implements IObject {

  static symbols: { [name: string]: Symbol; } = {};

  type: Type = Type.SYMBOL;

  name: string;

  constructor(name: string) {
    // make sure that there is exactly one copy for each symbol
    if (Object.prototype.hasOwnProperty.call(Symbol.symbols, name)) {
      return Symbol.symbols[name];
    } else {
      this.name = name;
      Symbol.symbols[name] = this;
    }
  }

  toJSON(): Object {
    return {
      type: this.type,
      name: this.name
    };
  }

  display(): string {
    return '\'' + this.name;
  }
}

export = Symbol;
