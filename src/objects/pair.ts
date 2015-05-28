import List from './list';
import ScmObject from './scmobject';
import Type from './type';
import Nil from './nil';

export default class Pair implements List {

  static fromArray(array: Array<ScmObject>): List {
    var list = Nil;
    for (let i = array.length - 1; i >= 0; --i) {
      list = new Pair(array[i], list);
    }
    return list;
  }

  type: Type = Type.Pair;

  car: ScmObject;
  cdr: ScmObject;


  constructor(car: ScmObject, cdr: ScmObject) {
    this.car = car;
    this.cdr = cdr;
  }

  toArray(): Array<ScmObject> {
    var array: Array<ScmObject> = [];
    var pair: ScmObject = this;
    for (; pair.type === Type.Pair; pair = pair.cdr) {
      array.push(pair.car);
    }
    if (pair !== Nil) {
      array.push(pair);
    }
    return array;
  }

  isProperList(): boolean {
    var pair: ScmObject = this;
    while (pair.type === Type.Pair) {
      pair = pair.cdr;
    }
    return pair === Nil;
  };

  getLength(): number {
    var len = 0;
    var pair: ScmObject = this;
    for (; pair.type === Type.Pair; pair = pair.cdr) {
      len += 1;
    }
    if (pair !== Nil) {
      len += 1;
    }
    return len;
  }

  /**
   * Convert the list to a proper list.
   * (x y . z) -> (x y z)
   */
  toProperList(): List {
    var pair: List = this;
    var list = Nil;
    for (; pair.type === Type.Pair; pair = pair.cdr) {
      list = new Pair(pair.car, list);
    }
    if (pair === Nil) {
      return list.reverse();
    } else {
      list = new Pair(pair, list);
      return list.reverse();
    }
  }

  getDotPosition(): number {
    var pos = 0;
    var pair = this;
    while (pair.type === Type.Pair) {
      pos += 1;
      pair = pair.cdr;
    }
    if (pair === Nil) {
      return pos;
    } else {
      return -1;
    }
  }

  reverse() {
    var ret = Nil;
    var pair: ScmObject = this;
    for (; pair.type === Type.Pair; pair = pair.cdr) {
      ret = new Pair(pair.car, ret);
    }
    return ret;
  }

  append(x: ScmObject) {
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
    for (; pair.type === Type.Pair; pair = pair.cdr) {
      strs.push(pair.car.display());
      strs.push(' ');
    }

    // after the for loop, `pair' now points to the last element in
    // the list.
    // if the last element is Nil, then the list is a proper list,
    // and we discard the excessive space.
    // else, the list is inproper, and we insert an dot before the 
    // last element.
    if (pair === Nil) {
      strs.pop();
    } else {
      strs.push('. ');
      strs.push(pair.display());
    }

    strs.push(')');

    return strs.join('');
  }
}
