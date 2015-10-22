import INode = require('./inode');
import Type = require('./type');
import Var = require('./var');

class Ref implements INode {
  
  type: Type = Type.REF;
  
  constructor() {
  }
}

export = Ref;
