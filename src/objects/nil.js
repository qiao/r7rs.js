var Nil = {};

Nil.type = 'nil';

Nil.length = function () {
    return 0;
};

Nil.toArray = function () {
    return [];
};

Nil.toJSON = function () {
    return {
        type: Nil.type
    };
};

module.exports = Nil;
