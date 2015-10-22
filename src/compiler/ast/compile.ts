import IObject = require('../../objects/iobject');
import ObjectType = require('../../objects/type');
import IList = require('../../objects/ilist');
import Symbol = require('../../objects/symbol');
import INode = require('./inode');
import Seq = require('./seq');
import Const = require('./const');
import Ref = require('./ref');
import If = require('./if');
import App = require('./app');
import Environment = require('./environment');


function compile(object: IObject, env: Environment): INode {
  if (object.type === ObjectType.SYMBOL) {
    return new Ref((<Symbol>object).name);
  }

  if (object.type !== ObjectType.PAIR) {
    return new Const(object);
  }

  const application = <IList>object;

  if (!application.isProperList()) {
    throw new Error('Expected function application to be proper list');
  }

  const [operator, ...operands] = application.toArray();

  if (operator.type !== ObjectType.SYMBOL) {
    throw new Error('Invalid application');
  }

  const resolvedOperator: IObject = env.lookup((<Symbol>operator));
  if (resolvedOperator.type === ObjectType.SYMBOL) {
    const compiledOperands: Array<INode> = [];
    for (let operand of operands) {
      compiledOperands.push(compile(operand, env));
    }
    return new App(new Var((<Symbol>resolvedOperator).name), compiledOperands);
  }

  if (resolvedOperator.type !== ObjectType.SYNTAX) {
    throw new Error('Invalid application');
  }

  switch ((<Symbol>resolvedOperator).name) {
    case 'if':
      return new If(
          compile(operands[0], env),
          compile(operands[1], env),
          compile(operands[2], env));
    default:
      break;
  }
}


/**
 * Compiles an array of objects to a single node.
 */
function compileAll(objects: Array<IObject>, env: Environment): INode {
  let exprs: Array<INode> = [];
  for (let obj of objects) {
    exprs.push(compile(obj, env));
  }
  return new Seq(exprs);
}

export = compileAll;
