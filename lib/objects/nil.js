var _this = this;
var Nil = {
    type: 4 /* NIL */,
    getLength: function () { return 0; },
    toArray: function () { return []; },
    isProperList: function () { return true; },
    display: function () { return '()'; },
    toJSON: function () { return ({ type: _this.type }); },
    reverse: function () { return Nil; }
};
exports["default"] = Nil;
