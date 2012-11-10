function Pair(car, cdr) {
    this.car = car;
    this.cdr = cdr;
}

Pair.prototype.toJSON = function () {
    return {
        type: 'pair',
        car: this.car,
        cdr: this.cdr
    };
};

module.exports = Pair;
