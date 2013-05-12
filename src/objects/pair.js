var Nil = require('./nil');


/**
 * @class
 */
function Pair(car, cdr) {
    this.car = car;
    this.cdr = cdr;
}


/**
 * @static
 * @function
 * @param {Array} array
 * @return {Pair}
 */
Pair.makeList = function (array) {
    var list = Nil,
        i;
    for (i = array.length - 1; i >= 0; --i) {
        list = new Pair(array[i], list);
    }
    return list;
};


/**
 * @property {String} type
 */
Pair.prototype.type = 'pair';


/**
 * @function
 * @return {Array}
 */
Pair.prototype.toArray = function () {
    var array = [], pair = this;
    while (pair.type === 'pair') {
        array.push(pair.car);
        pair = pair.cdr;
    }
    if (pair !== Nil) {
        array.push(pair);
    }
    return array;
};


/**
 * Compute and return the length of the list (assuming it's a proper list).
 * @function
 * @return {Number}
 */
Pair.prototype.getLength = function () {
    var len = 0, pair = this;
    while (pair !== Nil) {
        len += 1;
        pair = pair.cdr;
    }
    return len;
};


/**
 * Convert the list to a proper list.
 * (x y . z) -> (x y z)
 * @function
 * @return {Pair}
 */
Pair.prototype.toProperList = function () {
    var pair = this,
        list = Nil;
    while (pair.type === 'pair') {
        list = new Pair(pair.car, list);
        pair = pair.cdr;
    }
    if (pair === Nil) {
        return list;
    } else {
        list = new Pair(pair, list);
        return list.reverse();
    }
};


/**
 * @function
 * @return {Number}
 */
Pair.prototype.getDotPosition = function () {
    var pos = 0,
        pair = this;
    while (pair.type === 'pair') {
        pos += 1;
        pair = pair.cdr;
    }
    if (pair === Nil) {
        return pos;
    } else {
        return -1;
    }
};


/**
 * Determine whether the pair is a proper list.
 * @function
 * @return {Boolean}
 */
Pair.prototype.isProperList = function () {
    var pair = this;
    while (pair.type === 'pair') {
        pair = pair.cdr;
    }
    return pair === Nil;
};


/**
 * Return the reversed list.
 * @function
 * @return {Pair}
 */
Pair.prototype.reverse = function () {
    var ret = Nil,
        pair = this;
    while (pair.type === 'pair') {
        ret = new Pair(pair.car, ret);
        pair = pair.cdr;
    }
    return ret;
};


/**
 * @function
 * @return {Object}
 */
Pair.prototype.toJSON = function () {
    return {
        type: this.type,
        car: this.car.toJSON(),
        cdr: this.cdr.toJSON()
    };
};


module.exports = Pair;
