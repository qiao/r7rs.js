import IObject = require('./iobject');
import Type = require('./type');

class Vector implements IObject {

  static make(n: number): Vector {
    return new Vector(new Array(n));
  }

  static makeWithFill(n: number, fill: IObject): Vector {
    var elements: Array<IObject> = new Array(n);

    for (var i = 0; i < n; ++i) {
      elements[i] = fill;
    }

    return new Vector(elements);
  }

  type: Type = Type.VECTOR;

  elements: Array<IObject>;

  constructor(elements: Array<IObject>) {
    this.elements = elements;
  }

  getLength(): number {
    return this.elements.length;
  }

  ref(i: number): IObject {
    // TODO: throw error on invalid index
    return this.elements[i];
  }

  set(i: number, v: IObject) {
    // TODO: throw error on invalid index
    this.elements[i] = v;
  }

  toJSON(): Object {
    return {
      type: this.type,
      elements: this.elements
    };
  }

  display(): string {
    // TODO
    return '\'#()';
  }
}

export = Vector;
