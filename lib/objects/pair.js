var type_1 = require('./type');
var nil_1 = require('./nil');
var Pair = (function () {
    function Pair(car, cdr) {
        this.type = type_1["default"].PAIR;
        this.car = car;
        this.cdr = cdr;
    }
    Pair.fromArray = function (array) {
        var list = nil_1["default"];
        for (var i = array.length - 1; i >= 0; --i) {
            list = new Pair(array[i], list);
        }
        return list;
    };
    Pair.prototype.toArray = function () {
        var array = [];
        var pair = this;
        for (; pair.type === type_1["default"].PAIR; pair = pair.cdr) {
            array.push(pair.car);
        }
        if (pair !== nil_1["default"]) {
            array.push(pair);
        }
        return array;
    };
    Pair.prototype.isProperList = function () {
        var pair = this;
        for (; pair.type === type_1["default"].PAIR; pair = pair.cdr) {
        }
        return pair === nil_1["default"];
    };
    ;
    Pair.prototype.getLength = function () {
        var len = 0;
        var pair = this;
        for (; pair.type === type_1["default"].PAIR; pair = pair.cdr) {
            len += 1;
        }
        if (pair !== nil_1["default"]) {
            len += 1;
        }
        return len;
    };
    /**
     * Convert the list to a proper list.
     * (x y . z) -> (x y z)
     */
    Pair.prototype.toProperList = function () {
        var pair = this;
        var list = nil_1["default"];
        for (; pair.type === type_1["default"].PAIR; pair = pair.cdr) {
            list = new Pair(pair.car, list);
        }
        if (pair === nil_1["default"]) {
            return list.reverse();
        }
        else {
            list = new Pair(pair, list);
            return list.reverse();
        }
    };
    Pair.prototype.getDotPosition = function () {
        var pos = 0;
        var pair = this;
        for (; pair.type === type_1["default"].PAIR; pair = pair.cdr) {
            pos += 1;
        }
        if (pair === nil_1["default"]) {
            return pos;
        }
        else {
            return -1;
        }
    };
    Pair.prototype.reverse = function () {
        var ret = nil_1["default"];
        var pair = this;
        for (; pair.type === type_1["default"].PAIR; pair = pair.cdr) {
            ret = new Pair(pair.car, ret);
        }
        return ret;
    };
    Pair.prototype.append = function (x) {
        var array = this.toArray();
        array.push(x);
        return Pair.fromArray(array);
    };
    Pair.prototype.toJSON = function () {
        return {
            type: this.type,
            car: this.car.toJSON(),
            cdr: this.cdr.toJSON()
        };
    };
    Pair.prototype.display = function () {
        var strs = [];
        var pair = this;
        strs.push('(');
        // push all the elements in the list except the last one
        for (; pair.type === type_1["default"].PAIR; pair = pair.cdr) {
            strs.push(pair.car.display());
            strs.push(' ');
        }
        // after the for loop, `pair' now points to the last element in
        // the list.
        // if the last element is Nil, then the list is a proper list,
        // and we discard the excessive space.
        // else, the list is inproper, and we insert an dot before the 
        // last element.
        if (pair === nil_1["default"]) {
            strs.pop();
        }
        else {
            strs.push('. ');
            strs.push(pair.display());
        }
        strs.push(')');
        return strs.join('');
    };
    return Pair;
})();
exports["default"] = Pair;
