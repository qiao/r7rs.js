import ScmObject = require('./scmobject');
import Type = require('./type');
import Bool = require('./bool');

class Real implements ScmObject {

  type: Type = Type.REAL;

  value: number;

  constructor(value: number) {
    this.value = value;
  }

  toJSON(): Object {
    return {
      type: this.type,
      value: this.value
    };
  }

  add(other: Real): Real {
    return new Real(this.value + other.value);
  }

  sub(other: Real): Real {
    return new Real(this.value - other.value);
  }

  mul(other: Real): Real {
    return new Real(this.value * other.value);
  };

  div(other: Real): Real {
    return new Real(this.value / other.value);
  };

  neg(other: Real): Real {
    return new Real(-this.value);
  }

  eql(other: Real): Bool {
    return new Bool(this.value === other.value);
  }

  lt(other: Real): Bool {
    return new Bool(this.value < other.value);
  };

  le(other: Real): Bool {
    return new Bool(this.value <= other.value);
  };

  gt(other: Real): Bool {
    return new Bool(this.value > other.value);
  };

  ge(other: Real): Bool {
    return new Bool(this.value >= other.value);
  };

  display(): string {
    if (this.value === Infinity) {
      return '+inf.0';
    }
    if (this.value === -Infinity) {
      return '-inf.0';
    }
    if (isNaN(this.value)) {
      return '+nan.0';
    }
    return String(this.value);
  }
}

export = Real;
