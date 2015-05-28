var Type;
(function (Type) {
    Type[Type["BOOL"] = 0] = "BOOL";
    Type[Type["BYTE_VECTOR"] = 1] = "BYTE_VECTOR";
    Type[Type["CHAR"] = 2] = "CHAR";
    Type[Type["COMPLEX"] = 3] = "COMPLEX";
    Type[Type["NIL"] = 4] = "NIL";
    Type[Type["PAIR"] = 5] = "PAIR";
    Type[Type["REAL"] = 6] = "REAL";
    Type[Type["STR"] = 7] = "STR";
    Type[Type["SYMBOL"] = 8] = "SYMBOL";
    Type[Type["SYNTAX"] = 9] = "SYNTAX";
    Type[Type["VECTOR"] = 10] = "VECTOR";
})(Type || (Type = {}));
exports["default"] = Type;
