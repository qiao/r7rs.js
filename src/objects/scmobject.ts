import Type from './type';

interface ScmObject {
  type: Type;
  toJSON: () => Object;
  display: () => string;
}

export default ScmObject;
