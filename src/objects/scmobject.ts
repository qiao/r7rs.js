import { Type } from './type';

export interface ScmObject {
  type: Type;
  toJSON: () => Object;
  display: () => string;
}
