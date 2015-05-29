var Syntax = (function () {
    function Syntax(name) {
        this.type = 9 /* SYNTAX */;
        // make sure that there is exactly one copy for each syntax
        if (Object.prototype.hasOwnProperty.call(Syntax.syntaxes, name)) {
            return Syntax.syntaxes[name];
        }
        else {
            this.name = name;
            Syntax.syntaxes[name] = this;
        }
    }
    Syntax.prototype.toJSON = function () {
        return {
            type: this.type,
            name: this.name
        };
    };
    Syntax.prototype.display = function () {
        return '#<syntax ' + this.name + '>';
    };
    Syntax.syntaxes = {};
    return Syntax;
})();
exports["default"] = Syntax;
