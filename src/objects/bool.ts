import ScmObject = require('./scmobject');
import Type = require('./type');

class Bool implements ScmObject {

  static True = new Bool(true);
  static False = new Bool(false);

  value: boolean;

  type: Type = Type.Bool;

  constructor(value: boolean) {
    if (value && Bool.True) {
      return Bool.True;
    } else if (!value && Bool.False) {
      return Bool.False;
    } else {
      this.value = value;
    }
  }

  toJSON() {
    return {
      type: this.type,
      value: this.value
    }
  }

  display() {
    return this.value ? '#t' : '#f';
  }
}

export = Bool;
