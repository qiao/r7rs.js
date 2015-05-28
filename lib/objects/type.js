var Type;
(function (Type) {
    Type[Type["Bool"] = 0] = "Bool";
    Type[Type["ByteVector"] = 1] = "ByteVector";
    Type[Type["Char"] = 2] = "Char";
    Type[Type["Closure"] = 3] = "Closure";
    Type[Type["Complex"] = 4] = "Complex";
    Type[Type["Nil"] = 5] = "Nil";
    Type[Type["Pari"] = 6] = "Pari";
    Type[Type["Real"] = 7] = "Real";
    Type[Type["Str"] = 8] = "Str";
    Type[Type["Symbol"] = 9] = "Symbol";
    Type[Type["Syntax"] = 10] = "Syntax";
    Type[Type["Vector"] = 11] = "Vector";
})(Type || (Type = {}));
module.exports = Type;
