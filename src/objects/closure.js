function Closure(body, env, numArgs, isVariadic) {
    this.body = body;
    this.env = env;
    this.numArgs = numArgs;
    this.isVariadic = isVariadic;
}

Closure.prototype.display = function () {
    return '#<closure>';
};

module.exports = Closure;
