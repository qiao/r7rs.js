import IObject = require('./iobject');
import IList = require('./ilist');
import Type = require('./type');

class Nil implements IList {

  type: Type = Type.NIL;

  getLength(): number {
    return 0;
  }

  toArray(): Array<IObject> {
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

  reverse(): IList {
    return this;
  }
}

export = new Nil();
