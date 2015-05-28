import ScmObject = require('./scmobject');

interface List extends ScmObject {
  isProperList: () => boolean;
  toArray: () => Array<ScmObject>;
}

export = List;
