var type_1 = require('./type');
var Str = (function () {
    function Str(value) {
        this.type = type_1["default"].STR;
        this.value = value;
    }
    Str.prototype.toJSON = function () {
        return {
            type: this.type,
            value: this.value
        };
    };
    Str.prototype.display = function () {
        return '"' + this.value + '"';
    };
    return Str;
})();
exports["default"] = Str;
