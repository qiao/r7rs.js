function Pair(car, cdr) {
    this.car = car;
    this.cdr = cdr;
}

Pair.prototype.type = 'pair';

Pair.prototype.toJSON = function () {
    return {
        type: this.type,
        car: this.car,
        cdr: this.cdr
    };
};

module.exports = Pair;
