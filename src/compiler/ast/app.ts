import Type = require('./type');
import INode = require('./inode');

class App implements INode {

  type: Type = Type.APP;

  operator: INode;

  operands: Array<INode>;

  constructor(operator: INode, operands: Array<INode>) {
    this.operator = operator;
    this.operands = operands;
  }
}

export = App;
