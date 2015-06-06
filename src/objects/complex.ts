import ScmObject = require('./scmobject');
import Type = require('./type');

class Complex implements ScmObject {

  type: Type = Type.COMPLEX;

  real: number;
  imag: number;

  constructor(real: number, imag: number) {
    this.real = real;
    this.imag = imag;
  }

  toJSON(): Object {
    return {
      type: this.type,
      real: this.real,
      imag: this.imag
    };
  }

  display(): string {
    return '';
  }
}

export = Complex;
