import List = require('./list');
import Type = require('./type');

export = <List>{
  type: Type.Nil,
  length: 0,
  toArray: () => { return [] },
  isProperList: () => { return true; },
  display: () => { return '()'; },
  toJSON: () => { return Type.Nil; }
};
