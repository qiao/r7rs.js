import Type = require('./type');
import INode = require('./inode');

class Seq implements INode {

  type: Type = Type.SEQ;

  exprs: Array<INode>;

  constructor(exprs: Array<INode>) {
    this.exprs = exprs;
  }
}

export = Seq;
