import ScmObject from './scmobject';

interface List extends ScmObject {
  isProperList: () => boolean;
  toArray: () => Array<ScmObject>;
  getLength: () => number;
  reverse: () => List;
}

export default List;
