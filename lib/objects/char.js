var type_1 = require('./type');
var Char = (function () {
    function Char(value) {
        this.type = type_1["default"].CHAR;
        this.value = value;
    }
    Char.prototype.toJSON = function () {
        return {
            type: this.type,
            value: this.value
        };
    };
    Char.prototype.display = function () {
        return '\#' + this.value;
    };
    return Char;
})();
exports["default"] = Char;
