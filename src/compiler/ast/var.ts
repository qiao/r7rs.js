import Type = require('./type');
import INode = require('./inode');

class Var implements INode {

  type: Type = Type.REF;

  name: string;

  constructor(name: string) {
    this.name = name;
  }
}

export = Var;
