function Complex(real, imag) {
  this.real = real; this.imag = imag;
}

Complex.prototype.type = 'complex';

Complex.prototype.toJSON = function () {
  return {
    type: 'complex',
    real: this.real,
    imag: this.imag
  };
};

module.exports = Complex;
