var Type = require('./type');
var Closure = (function () {
    function Closure(body, env, numArgs, isVariadic) {
        this.type = 3 /* Closure */;
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
    return Closure;
})();
module.exports = Closure;
