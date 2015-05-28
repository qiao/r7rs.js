var Type = require('./type');
var Bool = (function () {
    function Bool(value) {
        this.type = 0 /* Bool */;
        if (value && Bool.True) {
            return Bool.True;
        }
        else if (!value && Bool.False) {
            return Bool.False;
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
    Bool.True = new Bool(true);
    Bool.False = new Bool(false);
    return Bool;
})();
module.exports = Bool;
