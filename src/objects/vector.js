function Vector(elements) {
    this.elements = elements;
}

Vector.make = function (n) {
    return new Vector(new Array(n));
};

Vector.makeWithFill = function (n, fill) {
    var i, elements = new Array(n);

    for (i = 0; i < n; ++i) {
        elements[i] = fill;
    }

    return new Vector(elements);
};

Vector.prototype.type = 'vector';

Vector.prototype.toJSON = function () {
    return {
        type: this.type,
        elements: this.elements
    };
};

module.exports = Vector;
