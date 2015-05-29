var Symbol = (function () {
    function Symbol(name) {
        this.type = 8 /* SYMBOL */;
        // make sure that there is exactly one copy for each symbol
        if (Object.prototype.hasOwnProperty.call(Symbol.symbols, name)) {
            return Symbol.symbols[name];
        }
        else {
            this.name = name;
            Symbol.symbols[name] = this;
        }
    }
    Symbol.prototype.toJSON = function () {
        return {
            type: this.type,
            name: this.name
        };
    };
    Symbol.prototype.display = function () {
        return '\'' + this.name;
    };
    Symbol.symbols = {};
    return Symbol;
})();
exports["default"] = Symbol;
