function SchemeString(value) {
    this.value = value;
}

SchemeString.prototype.toJSON = function () {
    return {
        type: 'string',
        value: this.value
    };
};

module.exports = SchemeString;
