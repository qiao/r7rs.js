var Nil = require('./nil');

function Pair(car, cdr) {
    this.car = car;
    this.cdr = cdr;
}

Pair.makeList = function (array) {
    var list = Nil,
        i;

    for (i = array.length - 1; i >= 0; --i) {
        list = new Pair(array[i], list);
    }
    return list;
};

Pair.prototype.type = 'pair';

Pair.prototype.toArray = function () {
    var array = [], pair = this;
    while (pair !== Nil) {
        array.push(pair.car);
        pair = pair.cdr;
    }
    return array;
};

Pair.prototype.length = function () {
    var len = 0, pair = this;
    while (pair !== Nil) {
        len += 1;
        pair = pair.cdr;
    }
    return len;
};

Pair.prototype.toJSON = function () {
    return {
        type: this.type,
        car: this.car,
        cdr: this.cdr
    };
};


module.exports = Pair;
