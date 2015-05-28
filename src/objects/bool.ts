import ScmObject from './scmobject';
import Type from './type';

export default class Bool implements ScmObject {

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
