function ByteVector(bytes) {
    this.bytes = bytes;
}

ByteVector.prototype.toJSON = function () {
    return {
        type: 'bytevector',
        bytes: this.bytes
    };
};

module.exports = ByteVector;
