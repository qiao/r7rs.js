function Symbol(name) {
    this.name = name;
}

Symbol.prototype.toJSON = function () {
    return {
        type: 'symbol',
        name: this.name
    };
};

module.exports = Symbol;
