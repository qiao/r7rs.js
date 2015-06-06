import IObject = require('./iobject');
import Type = require('./type');

class Bool implements IObject {

  static TRUE: Bool = new Bool(true);
  static FALSE: Bool = new Bool(false);

  value: boolean;

  type: Type = Type.BOOL;

  constructor(value: boolean) {
    if (value && Bool.TRUE) {
      return Bool.TRUE;
    } else if (!value && Bool.FALSE) {
      return Bool.FALSE;
    } else {
      this.value = value;
    }
  }

  toJSON(): Object {
    return {
      type: this.type,
      value: this.value
    };
  }

  display(): string {
    return this.value ? '#t' : '#f';
  }
}

export = Bool;
