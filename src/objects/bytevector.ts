import ScmObject = require('./scmobject');
import Type = require('./type');

class ByteVector implements ScmObject {

  type: Type = Type.BYTE_VECTOR;

  bytes: Array<number>;

  constructor(bytes: Array<number>) {
    this.bytes = bytes;
  }

  toJSON(): Object {
    return {
      type: this.type,
      bytes: this.bytes
    };
  }

  display(): string {
    return '#vu8(TODO)';
  }
}

export = ByteVector;
