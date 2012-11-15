function Bool(value) {
    this.value = value;

    // if Bool.True and Bool.False are already defined,
    // then return the corresponding instance.
    if (this.value && Bool.True) {
        return Bool.True;
    } else if (!this.value && Bool.False) {
        return Bool.False;
    }
}

Bool.True = new Bool(true);
Bool.False = new Bool(false);

Bool.prototype.type = 'bool';

Bool.prototype.toJSON = function () {
    return {
        type: this.type,
        value: this.value
    };
};

module.exports = Bool;
