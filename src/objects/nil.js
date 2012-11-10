var Nil = {};

Nil.toJSON = function () {
    return {
        type: 'nil'
    };
};

module.exports = Nil;
