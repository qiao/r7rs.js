import Type = require('./type');

interface IObject {
  type: Type;
  toJSON: () => Object;
  display: () => string;
}

export = IObject;
