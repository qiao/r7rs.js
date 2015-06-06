var Complex = (function () {
    function Complex(real, imag) {
        this.type = 3 /* COMPLEX */;
        this.real = real;
        this.imag = imag;
    }
    Complex.prototype.toJSON = function () {
        return {
            type: this.type,
            real: this.real,
            imag: this.imag
        };
    };
    Complex.prototype.display = function () {
        return '';
    };
    return Complex;
})();
module.exports = Complex;
