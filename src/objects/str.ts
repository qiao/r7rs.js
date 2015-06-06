import ScmObject = require('./scmobject');
import Type = require('./type');

class Str implements ScmObject {
  
  type: Type = Type.STR;

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
    return '"' + this.value + '"';
  }
}

export = Str;
