import ScmObject from './scmobject';
import Type from './type';

export default class ByteVector implements ScmObject {

  type: Type = Type.BYTE_VECTOR;

  bytes: Array<number>;

  constructor(bytes: Array<number>) {
    this.bytes = bytes;
  }

  toJSON() {
    return {
      type: this.type,
      bytes: this.bytes
    };
  }

  display() {
    return '#vu8(TODO)'
  }
}
