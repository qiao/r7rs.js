function Bool(value) {
    this.value = value;
}

Bool.prototype.type = 'bool';

Bool.prototype.toJSON = function () {
    return {
        type: this.type,
        value: this.value
    };
};

module.exports = Bool;
