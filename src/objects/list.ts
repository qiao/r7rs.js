import { ScmObject } from './scmobject';

export interface List extends ScmObject {
  isProperList: () => boolean;
  toArray: () => Array<ScmObject>;
  getLength: () => number;
  reverse: () => List;
}
