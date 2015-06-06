var Bool = (function () {
    function Bool(value) {
        this.type = 0 /* BOOL */;
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
module.exports = Bool;
