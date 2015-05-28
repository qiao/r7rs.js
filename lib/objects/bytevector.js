var type_1 = require('./type');
var ByteVector = (function () {
    function ByteVector(bytes) {
        this.type = type_1["default"].BYTE_VECTOR;
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
