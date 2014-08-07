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
 * Create a name-value binding in the environment.
 * @param {String} name
 * @param {*} value
 */
Environment.prototype.define = function (name, value) {
  this._store(name, value);
};


/**
 * Get the index of the name in the environment.
 * The index can later be used for accessing the bound
 * value of the name in a quicker manner.
 * @public
 * @method
 * @param {String} name 
 * @return {Number} The index of the name, -1 if the name is undefined
 */
Environment.prototype.getIndex = function (name) {
  var i = this._indices[name];
  if (i !== undefined) {
    return i;
  }

  if (!this._parent) {
    return -1;
  }

  var value = this._parent.lookupByName(name);
  if (value === null) {
    return -1;
  }

  return this._store(name, value);
};


/**
 * Store the name-value binding in the environment
 * and returns the index of the binding.
 * @param {String} name
 * @param {*} value
 * @return {Number} The index of the binding
 */
Environment.prototype._store = function (name, value) {
  this._indices[name] = this._values.length;
  this._values.push(value);
  return this._values.length - 1;
};


/**
 * Look up the bound value of the name in the environment.
 * @param {String} name
 * @return {*} The bound value, null if the name is undefined
 */
Environment.prototype.lookupByName = function (name) {
  var index = this.getIndex(name);
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
