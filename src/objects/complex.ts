import ScmObject = require('./scmobject');
import Type = require('./type');

class Complex implements ScmObject {
  
  type: Type = Type.Complex;

  real: number;
  imag: number;

  constructor(real: number, imag: number) {
    this.real = real;
    this.imag = imag;
  }

  toJSON() {
    return {
      type: this.type,
      real: this.real,
      imag: this.imag
    };
  }

  display() {
    return '';
  }
}

export = Complex;
