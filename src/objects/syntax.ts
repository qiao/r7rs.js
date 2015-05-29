import { ScmObject } from './scmobject';
import { Type } from './type';

export class Syntax implements ScmObject {

  static syntaxes: { [name: string]: Syntax; } = {};

  type: Type = Type.SYNTAX;

  name: string;

  constructor(name: string) {
    // make sure that there is exactly one copy for each syntax
    if (Object.prototype.hasOwnProperty.call(Syntax.syntaxes, name)) {
      return Syntax.syntaxes[name];
    } else {
      this.name = name;
      Syntax.syntaxes[name] = this;
    }
  }

  toJSON() {
    return {
      type: this.type,
      name: this.name
    };
  }

  display() {
    return '#<syntax ' + this.name + '>';
  }
}
