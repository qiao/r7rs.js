import ScmObject = require('./scmobject');
import List = require('./list');
import Type = require('./type');

class Nil implements List {

  type: Type = Type.NIL;

  getLength(): number {
    return 0;
  }

  toArray(): Array<ScmObject> {
    return [];
  }

  isProperList(): boolean {
    return false;
  }

  display(): string {
    return '()';
  }

  toJSON(): Object {
    return {
      type: this.type
    };
  }

  reverse(): List {
    return this;
  }
}

export = new Nil();
