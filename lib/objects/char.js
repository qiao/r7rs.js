var Char = (function () {
    function Char(value) {
        this.type = 2 /* CHAR */;
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
module.exports = Char;
