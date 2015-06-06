import ScmObject = require('./scmobject');

interface List extends ScmObject {
  isProperList: () => boolean;
  toArray: () => Array<ScmObject>;
  getLength: () => number;
  reverse: () => List;
}

export = List;
