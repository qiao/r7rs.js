import { List } from './list';
import { Type } from './type';

export const Nil: List = {
  type: Type.NIL,
  getLength: () => 0,
  toArray: () => [],
  isProperList: () => true,
  display: () => '()',
  toJSON: () => ({ type: this.type }),
  reverse: () => Nil
};
