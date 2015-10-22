import Type = require('./type');
import INode = require('./inode');

class If implements INode {

  type: Type = Type.IF;

  test: INode;
  body: INode;
  orelse: INode;

  constructor(test: INode, body: INode, orelse: INode) {
    this.test = test;
    this.body = body;
    this.orelse = orelse;
  }
}

export = If;
