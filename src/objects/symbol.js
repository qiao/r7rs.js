function Symbol(name) {
    // make sure that there is exactly one copy for each symbol
    if (Object.prototype.hasOwnProperty.call(Symbol.symbols, name)) {
        return Symbol.symbols[name];
    } else {
        this.name = name;
        Symbol.symbols[name] = this;
    }
}

Symbol.symbols = {}; // allocated symbols

Symbol.prototype.type = 'symbol';

Symbol.prototype.toJSON = function () {
    return {
        type: this.type,
        name: this.name
    };
};

Symbol.prototype.display = function () {
    return '\'' + this.name;
};

module.exports = Symbol;
