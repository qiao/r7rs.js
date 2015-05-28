import ScmObject = require('./scmobject');
import Type = require('./type');

class ByteVector implements ScmObject {

  type: Type = Type.ByteVector;

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
