import ScmObject = require('./scmobject');
import Type = require('./type');

class Char implements ScmObject {

  type: Type = Type.CHAR;

  value: string;

  constructor(value: string) {
    this.value = value;
  }

  toJSON(): Object {
    return {
      type: this.type,
      value: this.value
    };
  }

  display(): string {
    return '\#' + this.value;
  }
}

export = Char;
