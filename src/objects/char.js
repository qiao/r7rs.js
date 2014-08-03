function Char(value) {
  this.value = value;
}

Char.prototype.type = 'char';

Char.prototype.toJSON = function () {
  return {
    type: this.type,
    value: this.value
  };
};

module.exports = Char;
