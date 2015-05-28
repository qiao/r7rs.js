class Char {
  value: string;
  constructor(value: string) {
    this.value = value;
  }
  type: string = 'char';
  toJSON() {
    return {
      type: this.type,
      value: this.value
    };
  }
}

export = Char;
