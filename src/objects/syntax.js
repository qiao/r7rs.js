function Syntax(name) {
    // make sure that there is exactly one copy for each syntax
    if (Object.hasOwnProperty.call(Syntax.syntaxes, name)) {
        return Syntax.syntaxes[name];
    } else {
        this.name = name;
        Syntax.syntaxes[name] = this;
    }
}

Syntax.syntaxes = {}; // allocated syntaxes

Syntax.prototype.display = function () {
    return '#<syntax ' + this.name + '>';
};
