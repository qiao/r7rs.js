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
    for (; pair.type === 'pair'; pair = pair.cdr) {
        array.push(pair.car);
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
    for (; pair !== Nil; pair = pair.cdr) {
        len += 1;
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
    for (; pair.type === 'pair'; pair = pair.cdr) {
        list = new Pair(pair.car, list);
    }
    if (pair === Nil) {
        return list.reverse();
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
    for (; pair.type === 'pair'; pair = pair.cdr) {
        ret = new Pair(pair.car, ret);
    }
    return ret;
};

Pair.prototype.display = function () {
    var strs = [], pair = this;

    strs.push('(');

    // push all the elements in the list except the last one
    for (; pair.type === 'pair'; pair = pair.cdr) {
        strs.push(pair.car.display());
        strs.push(' ');
    }

    // after the for loop, `pair' now points to the last element in
    // the list.
    // if the last element is Nil, then the list is a proper list,
    // and we discard the excessive space.
    // else, the list is inproper, and we insert an dot before the 
    // last element.
    if (pair === Nil) {
        strs.pop();
    } else {
        strs.push('. ');
        strs.push(pair.display());
    }

    strs.push(')');

    return strs.join('');
};

Pair.prototype.append = function (x) {
    var array = this.toArray();
    array.push(x);
    return Pair.makeList(array);
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
