var Str = (function () {
    function Str(value) {
        this.type = 7 /* STR */;
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
