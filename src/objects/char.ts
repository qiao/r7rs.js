import { ScmObject } from './scmobject';
import { Type } from './type';

export class Char implements ScmObject {

  type: Type = Type.CHAR;

  value: string;

  constructor(value: string) {
    this.value = value;
  }

  toJSON() {
    return {
      type: this.type,
      value: this.value
    };
  }

  display() {
    return '\#' + this.value;
  }
}
