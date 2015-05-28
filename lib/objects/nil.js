var type_1 = require('./type');
var Nil = {
    type: type_1["default"].NIL,
    getLength: function () { return 0; },
    toArray: function () { return []; },
    isProperList: function () { return true; },
    display: function () { return '()'; },
    toJSON: function () { return type_1["default"].NIL; },
    reverse: function () { return Nil; }
};
exports["default"] = Nil;
