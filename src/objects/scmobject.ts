import Type = require('./type');

interface ScmObject {
  type: Type;
  toJSON: () => Object;
  display: () => string;
}

export = ScmObject;
