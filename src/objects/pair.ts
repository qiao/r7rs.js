import { List } from './list';
import { ScmObject } from './scmobject';
import { Type } from './type';
import { NIL } from './nil';

export class Pair implements List {

  static fromArray(array: Array<ScmObject>): List {
    var list = NIL;
    for (let i = array.length - 1; i >= 0; --i) {
      list = new Pair(array[i], list);
    }
    return list;
  }

  type: Type = Type.PAIR;

  car: ScmObject;
  cdr: ScmObject;

  constructor(car: ScmObject, cdr: ScmObject) {
    this.car = car;
    this.cdr = cdr;
  }

  toArray(): Array<ScmObject> {
    var array: Array<ScmObject> = [];
    var pair: ScmObject = this;
    for (; pair.type === Type.PAIR; pair = (<Pair>pair).cdr) {
      array.push((<Pair>pair).car);
    }
    if (pair !== NIL) {
      array.push(pair);
    }
    return array;
  }

  isProperList(): boolean {
    var pair: ScmObject = this;
    for (; pair.type === Type.PAIR; pair = (<Pair>pair).cdr) {
    }
    return pair === NIL;
  };

  getLength(): number {
    var len = 0;
    var pair: ScmObject = this;
    for (; pair.type === Type.PAIR; pair = (<Pair>pair).cdr) {
      len += 1;
    }
    if (pair !== NIL) {
      len += 1;
    }
    return len;
  }

  /**
   * Convert the list to a proper list.
   * (x y . z) -> (x y z)
   */
  toProperList(): List {
    var pair: ScmObject = this;
    var list: List = NIL;
    for (; pair.type === Type.PAIR; pair = (<Pair>pair).cdr) {
      list = new Pair((<Pair>pair).car, list);
    }
    if (pair === NIL) {
      return list.reverse();
    } else {
      list = new Pair(pair, list);
      return list.reverse();
    }
  }

  getDotPosition(): number {
    var pos: number = 0;
    var pair: ScmObject = this;
    for (; pair.type === Type.PAIR; pair = (<Pair>pair).cdr) {
      pos += 1;
    }
    if (pair === NIL) {
      return pos;
    } else {
      return -1;
    }
  }

  reverse(): List {
    var ret: List = NIL;
    var pair: ScmObject = this;
    for (; pair.type === Type.PAIR; pair = (<Pair>pair).cdr) {
      ret = new Pair((<Pair>pair).car, ret);
    }
    return ret;
  }

  append(x: ScmObject): List {
    var array = this.toArray();
    array.push(x);
    return Pair.fromArray(array);
  }

  toJSON(): Object {
    return {
      type: this.type,
      car: this.car.toJSON(),
      cdr: this.cdr.toJSON()
    };
  }

  display(): string {
    var strs: Array<string> = [];
    var pair: ScmObject = this;

    strs.push('(');

    // push all the elements in the list except the last one
    for (; pair.type === Type.PAIR; pair = (<Pair>pair).cdr) {
      strs.push((<Pair>pair).car.display());
      strs.push(' ');
    }

    // after the for loop, `pair' now points to the last element in
    // the list.
    // if the last element is NIL, then the list is a proper list,
    // and we discard the excessive space.
    // else, the list is inproper, and we insert an dot before the 
    // last element.
    if (pair === NIL) {
      strs.pop();
    } else {
      strs.push('. ');
      strs.push(pair.display());
    }

    strs.push(')');

    return strs.join('');
  }
}
