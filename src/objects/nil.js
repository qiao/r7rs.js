var Nil = {};

Nil.type = 'nil';

Nil.toJSON = function () {
    return {
        type: Nil.type
    };
};

module.exports = Nil;
