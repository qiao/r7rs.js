import { ScmObject } from './scmobject';
import { Type } from './type';

export class Vector implements ScmObject {

  static make(n: number): Vector {
    return new Vector(new Array(n));
  }

  static makeWithFill(n: number, fill: ScmObject): Vector {
    var elements: Array<ScmObject> = new Array(n);

    for (var i = 0; i < n; ++i) {
      elements[i] = fill;
    }

    return new Vector(elements);
  }
  
  type: Type = Type.VECTOR;

  elements: Array<ScmObject>;

  constructor(elements: Array<ScmObject>) {
    this.elements = elements;
  }

  getLength(): number {
    return this.elements.length;
  }

  ref(i: number): ScmObject {
    // TODO: throw error on invalid index
    return this.elements[i];
  }

  set(i: number, v: ScmObject) {
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
