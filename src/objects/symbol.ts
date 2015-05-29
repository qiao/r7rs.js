import ScmObject from './scmobject';
import Type from './type';

export default class Symbol implements ScmObject {

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

  toJSON() {
    return {
      type: this.type,
      name: this.name
    };
  }

  display() {
    return '\'' + this.name;
  }
}
