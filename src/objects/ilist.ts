import IObject = require('./iobject');

interface IList extends IObject {
  isProperList: () => boolean;
  toArray: () => Array<IObject>;
  getLength: () => number;
  reverse: () => IList;
}

export = IList;
