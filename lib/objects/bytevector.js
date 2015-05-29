var ByteVector = (function () {
    function ByteVector(bytes) {
        this.type = 1 /* BYTE_VECTOR */;
        this.bytes = bytes;
    }
    ByteVector.prototype.toJSON = function () {
        return {
            type: this.type,
            bytes: this.bytes
        };
    };
    ByteVector.prototype.display = function () {
        return '#vu8(TODO)';
    };
    return ByteVector;
})();
exports["default"] = ByteVector;
