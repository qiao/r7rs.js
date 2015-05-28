var Char = (function () {
    function Char(value) {
        this.type = 'char';
        this.value = value;
    }
    Char.prototype.toJSON = function () {
        return {
            type: this.type,
            value: this.value
        };
    };
    return Char;
})();
module.exports = Char;
