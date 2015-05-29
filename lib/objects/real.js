var bool_1 = require('./bool');
var Real = (function () {
    function Real(value) {
        this.type = 6 /* REAL */;
        this.value = value;
    }
    Real.prototype.toJSON = function () {
        return {
            type: this.type,
            value: this.value
        };
    };
    Real.prototype.add = function (other) {
        return new Real(this.value + other.value);
    };
    Real.prototype.sub = function (other) {
        return new Real(this.value - other.value);
    };
    Real.prototype.mul = function (other) {
        return new Real(this.value * other.value);
    };
    ;
    Real.prototype.div = function (other) {
        return new Real(this.value / other.value);
    };
    ;
    Real.prototype.neg = function (other) {
        return new Real(-this.value);
    };
    Real.prototype.eql = function (other) {
        return new bool_1["default"](this.value === other.value);
    };
    Real.prototype.lt = function (other) {
        return new bool_1["default"](this.value < other.value);
    };
    ;
    Real.prototype.le = function (other) {
        return new bool_1["default"](this.value <= other.value);
    };
    ;
    Real.prototype.gt = function (other) {
        return new bool_1["default"](this.value > other.value);
    };
    ;
    Real.prototype.ge = function (other) {
        return new bool_1["default"](this.value >= other.value);
    };
    ;
    Real.prototype.display = function () {
        if (this.value === Infinity) {
            return '+inf.0';
        }
        if (this.value === -Infinity) {
            return '-inf.0';
        }
        if (isNaN(this.value)) {
            return '+nan.0';
        }
        return String(this.value);
    };
    return Real;
})();
exports["default"] = Real;
