function Closure(body, env, numArgs, isVariadic) {
    this.body = body;
    this.env = env;
    this.numArgs = numArgs;
    this.isVariadic = isVariadic;
}

Closure.prototype.display = function () {
    if (this.body.type === 'nuate') {
        return '#<continuation>';
    }
    return '#<closure>';
};

module.exports = Closure;
