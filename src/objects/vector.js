function Vector(elements) {
    this.elements = elements;
}

Vector.prototype.type = 'vector';

Vector.prototype.toJSON = function () {
    return {
        type: this.type,
        elements: this.elements
    };
};

module.exports = Vector;
