function Bool(value) {
    this.value = value;
}

Bool.prototype.toJSON = function () {
    return {
        type: 'bool',
        value: this.value
    };
};

module.exports = Bool;
