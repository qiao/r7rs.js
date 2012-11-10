function Symbol(name) {
    this.name = name;
}

Symbol.prototype.type = 'symbol';

Symbol.prototype.toJSON = function () {
    return {
        type: this.type,
        name: this.name
    };
};

module.exports = Symbol;
