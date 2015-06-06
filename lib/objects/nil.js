var Nil = (function () {
    function Nil() {
        this.type = 4 /* NIL */;
    }
    Nil.prototype.getLength = function () {
        return 0;
    };
    Nil.prototype.toArray = function () {
        return [];
    };
    Nil.prototype.isProperList = function () {
        return false;
    };
    Nil.prototype.display = function () {
        return '()';
    };
    Nil.prototype.toJSON = function () {
        return {
            type: this.type
        };
    };
    Nil.prototype.reverse = function () {
        return this;
    };
    return Nil;
})();
module.exports = new Nil();
