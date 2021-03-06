function Environment(parent) {
  /**
   * A map from symbol name to its index
   * @private
   */
  this._indices = {};

  /**
   * An array containing the values of the defined symbols in the environemnt
   * @private
   */
  this._values = [];

  /**
   * Parent environment.
   * @private
   */
  this._parent = parent;
}


/**
 * Create a symbol-value binding in the environment.
 * @param {Symbol} symbol
 * @param {*} value
 */
Environment.prototype.define = function (symbol, value) {
  this._store(symbol, value);
};


/**
 * Get the index of the symbol in the environment.
 * The index can later be used for accessing the bound
 * value of the symbol in a quicker manner.
 * @public
 * @method
 * @param {Symbol} symbol
 * @return {Number} The index of the symbol, -1 if the symbol is undefined
 */
Environment.prototype.getIndex = function (symbol) {
  var i = this._indices[symbol.name];
  if (i !== undefined) {
    return i;
  }

  if (!this._parent) {
    return -1;
  }

  var value = this._parent.lookupBySymbol(symbol);
  if (value === null) {
    return -1;
  }

  return this._store(symbol, value);
};


Environment.prototype._store = function (symbol, value) {
  this._indices[symbol.name] = this._values.length;
  this._values.push(value);
  return this._values.length - 1;
};


/**
 * Look up the bound value of the symbol in the environment.
 * @param {Symbol} symbol
 * @return {*} The bound value, null if the symbol is undefined
 */
Environment.prototype.lookupBySymbol = function (symbol) {
  var index = this.getIndex(symbol);
  if (index === -1) {
    return null;
  }
  return this._values[index];
};


/**
 * Look up the bound value at the given index;
 * @param {Number} index
 * @return {*} The bound value
 */
Environment.prototype.lookupByIndex = function (index) {
  return this._values[index];
};

module.exports = Environment;
