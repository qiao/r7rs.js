var Nil = {};

Nil.type = 'nil';

Nil.length = function () {
    return 0;
};

Nil.toJSON = function () {
    return {
        type: Nil.type
    };
};

module.exports = Nil;
