import List from './list';
import Type from './type';

var Nil: List = {
  type: Type.Nil,
  getLength: () => { return 0; },
  toArray: () => { return [] },
  isProperList: () => { return true; },
  display: () => { return '()'; },
  toJSON: () => { return Type.Nil; },
  reverse: () => { return Nil; }
};

export default Nil;
