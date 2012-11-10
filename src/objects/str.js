// Since `String` is a builtin type in ECMAScript, so we use `Str` instead.
function Str(value) {
    this.value = value;
}

Str.prototype.type = 'string';

Str.prototype.toJSON = function () {
    return {
        type: this.type,
        value: this.value
    };
};

module.exports = Str;
