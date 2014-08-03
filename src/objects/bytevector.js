function ByteVector(bytes) {
  this.bytes = bytes;
}

ByteVector.prototype.type = 'bytevector';

ByteVector.prototype.toJSON = function () {
  return {
    type: this.type,
    bytes: this.bytes
  };
};

module.exports = ByteVector;
