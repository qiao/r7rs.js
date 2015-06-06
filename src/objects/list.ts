import IObject = require('./iobject');

interface List extends IObject {
  isProperList: () => boolean;
  toArray: () => Array<IObject>;
  getLength: () => number;
  reverse: () => List;
}

export = List;
