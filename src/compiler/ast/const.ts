import Type = require('./type');
import IObject = require('../../objects/iobject');
import INode = require('./inode');

class Const implements INode {

  type: Type = Type.CONST;

  value: IObject;

  constructor(value: IObject) {
    this.value = value;
  }
}

export = Const;
