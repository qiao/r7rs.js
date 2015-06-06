import ScmObject = require('./scmobject');
import List = require('./list');
import Type = require('./type');

class Nil implements List {

  type: Type = Type.NIL;

  getLength() {
    return 0;
  }

  toArray(): Array<ScmObject> {
    return [];
  }

  isProperList() {
    return false;
  }

  display() {
    return '()';
  }

  toJSON(): Object {
    return {
      type: this.type
    };
  }

  reverse() {
    return this;
  }
}

export = new Nil();
