function Vector(elements) {
    this.elements = elements;
}

Vector.prototype.toJSON = function () {
    return {
        type: 'vector',
        elements: this.elements
    };
};

module.exports = Vector;
