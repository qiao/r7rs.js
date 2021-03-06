function Vector(elements) {
  this.elements = elements;
}

Vector.make = function (n) {
  return new Vector(new Array(n));
};

Vector.makeWithFill = function (n, fill) {
  var elements = new Array(n);

  for (var i = 0; i < n; ++i) {
    elements[i] = fill;
  }

  return new Vector(elements);
};

Vector.prototype.type = 'vector';

Vector.prototype.getLength = function () {
  return this.elements.length;
};

Vector.prototype.ref = function (i) {
  // TODO: throw error on invalid index
  return this.elements[i];
};

Vector.prototype.set = function (i, v) {
  // TODO: throw error on invalid index
  this.elements[i] = v;
};

Vector.prototype.toJSON = function () {
  return {
    type: this.type,
    elements: this.elements
  };
};

module.exports = Vector;
