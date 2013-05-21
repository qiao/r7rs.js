var Bool = require('./bool');

function Real(value) {
    this.value = value;
}

Real.prototype.toJSON = function () {
    return {
        type: 'real',
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

Real.prototype.div = function (other) {
    return new Real(this.value / other.value);
};

Real.prototype.neg = function () {
    return new Real(-this.value);
};

Real.prototype.eql = function (other) {
    return new Bool(this.value === other.value);
};

Real.prototype.lt = function (other) {
    return new Bool(this.value < other.value);
};

Real.prototype.gt = function (other) {
    return new Bool(this.value > other.value);
};

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

module.exports = Real;
