function Real(value) {
    this.value = value;
}

Real.prototype.toJSON = function () {
    return {
        type: 'real',
        value: this.value
    };
};

module.exports = Real;
