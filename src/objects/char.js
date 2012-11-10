function Char(value) {
    this.value = value;
}

Char.prototype.toJSON = function () {
    return {
        type: 'char',
        value: this.value
    };
};

module.exports = Char;
