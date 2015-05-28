var type_1 = require('./type');
var Bool = (function () {
    function Bool(value) {
        this.type = type_1["default"].BOOL;
        if (value && Bool.TRUE) {
            return Bool.TRUE;
        }
        else if (!value && Bool.FALSE) {
            return Bool.FALSE;
        }
        else {
            this.value = value;
        }
    }
    Bool.prototype.toJSON = function () {
        return {
            type: this.type,
            value: this.value
        };
    };
    Bool.prototype.display = function () {
        return this.value ? '#t' : '#f';
    };
    Bool.TRUE = new Bool(true);
    Bool.FALSE = new Bool(false);
    return Bool;
})();
exports["default"] = Bool;
