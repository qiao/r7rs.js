function Vector(elements) {
    this.elements = elements;
}

Vector.prototype.type = 'vector';

Vector.prototype.toJSON = function () {
    return {
        type: this.vector,
        elements: this.elements
    };
};

module.exports = Vector;
