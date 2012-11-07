/* vim: set sw=4 ts=4 tw=80: */

/**
 * Lexical Analyzer
 */
function Lexer(source) {
    this.source = source;
    this.length = source.length;
    this.index = 0;
    this.current = source[0];
    this.lineNumber = 1;
}

Lexer.prototype.reset = function (source) {
    Lexer.call(this, source);
};

// Scan and return the next token.
Lexer.prototype.nextToken = function () {
    // <token> ::= <identifier>
    //           | <boolean>
    //           | <number>
    //           | <character>
    //           | <string>
    //           | (
    //           | )
    //           | #(
    //           | #u8(
    //           | '
    //           | `
    //           | ,
    //           | ,@
    //           | .
    var ch;

    while (this.current) {
        switch (this.current) {
            case '\n':
            case '\r':
                this.skipLineEnding();
                break;
            case ' ':
            case '\t':
                this.next();
                break;
            case ';': // inline comment
                this.skipInlineComment();
                break;
            case '#':
                this.next();
                switch (this.current) {
                    case '|': // #|
                        this.skipNestedComment();
                        break;
                    case 't':
                    case 'f': // #t | #true | #f | #false
                        return this.scanBoolean();
                    case '\\': // #\<character> | #\<character name> | #\x<hex>;
                        return this.scanCharacter();
                    case '(': // #(
                        return {
                            type: '#(',
                            lineNumber: this.lineNumber
                        };
                    case 'u': // #u8(
                        return this.scanByteVector();
                    case 'i':
                    case 'I':
                    case 'e':
                    case 'E':
                    case 'b':
                    case 'B':
                    case 'o':
                    case 'O':
                    case 'd':
                    case 'D':
                    case 'x':
                    case 'X':
                        return this.scanPrefixedNumber();
                    default:
                        this.error('illegal token');
                }
                break;
            case '(':
            case ')':
            case '\'':
            case '`':
                ch = this.current;
                this.next();
                return {
                    type: ch,
                    lineNumber: this.lineNumber
                };
            case ',':
                this.next();
                if (this.current === '@') {
                    this.next();
                    ch = ',@';
                } else {
                    ch = ',';
                }
                return {
                    type: ch,
                    lineNumber: this.lineNumber
                };
            case '"':
                return this.scanString();
            case '.':
                this.next();
                if (this.isDigit(this.current)) {
                    this.prev();
                    return this.scanNumber();
                } else {
                    this.prev();
                    return this.scanIdentifier();
                }
                break;
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                return this.scanNumber();
            default:
                return this.scanIdentifier();
        }
    }

    return {
        type: 'EOF',
        lineNumber: this.lineNumber
    };
};

// Move forward by one character.
Lexer.prototype.next = function () {
    this.current = this.source[++this.index];
};

// Move backward by one character.
Lexer.prototype.prev = function () {
    this.current = this.source[--this.index];
};

Lexer.prototype.error = function (message) {
    message = ([
        'Line ',
        this.lineNumber,
        ': ',
        message,
    ]).join('');

    throw new Error(message);
};

Lexer.prototype.isLetter = function (ch) {
    return (ch >= 'a' && ch <= 'z')  ||
           (ch >= 'A' && ch <= 'Z');
};

Lexer.prototype.isBinaryDigit = function (ch) {
    return ch === '0' || ch === '1';
};

Lexer.prototype.isOctalDigit = function (ch) {
    return ch >= '0' && ch <= '7';
};

Lexer.prototype.isDigit = function (ch) {
    return ch >= '0' && ch <= '9';
};

Lexer.prototype.isDigitOfRadix = function (ch, radix) {
    switch (radix) {
        case 2: return this.isBinaryDigit(ch);
        case 8: return this.isOctalDigit(ch);
        case 16: return this.isHexDigit(ch);
        default: return this.isDigit(ch);
    }
};

Lexer.prototype.isHexDigit = function (ch) {
    return '0123456789abcdefABCDEF'.indexOf(ch) >= 0;
};

Lexer.prototype.isIntralineWhitespace = function (ch) {
    // <intraline whitespace> ::= <space or tab>
    return ch === ' ' || ch === '\t';
};

Lexer.prototype.isWhiteSpace = function (ch) {
    // <whitespace> ::= <intraline whitespace>
    //                | <newline>
    //                | <return>
    return ch === ' '  || ch === '\t' || ch === '\n' || ch === '\r';
};

Lexer.prototype.isLineEnding = function (ch) {
    return ch === '\n' || ch === '\r';
};

Lexer.prototype.isDelimiter = function (ch) {
    // <delimiter> ::= <whitespace>
    //               | (
    //               | )
    //               | "
    //               | ;
    //               | |
    return this.isWhiteSpace(ch) ||
           ch === '('            ||
           ch === ')'            ||
           ch === '"'            ||
           ch === ';'            ||
           ch === '|';
};

Lexer.prototype.isCommentStart = function (ch) {
    return ch === ';' || ch === '#';
};

Lexer.prototype.isAtmosphereStart = function (ch) {
    // <atmosphere> ::= <whitespace>
    //                | <comment>
    return this.isWhiteSpace(ch) ||
           this.isCommentStart(ch);
};

Lexer.prototype.skipLineEnding = function () {
    var old = this.current;
    this.next();
    if (old === '\r' && this.current === '\n') {
        this.next();
    }
    this.lineNumber += 1;
};

Lexer.prototype.skipInlineComment = function () {
    while (this.current && !this.isLineEnding(this.current)) {
        this.next();
    }
};

Lexer.prototype.skipNestedComment = function () {
    // <nested comment> ::= #| <comment text>
    //                         <comment cont>* |#
    //
    // <comment text> ::= <character sequence not containing
    //                     #| or |#>
    //
    // <comment cont> ::= <nested comment> <comment text>
    var depth = 1;

    this.next();

    while (true) {
        if (this.current === '\r' || this.current === '\n') {
            this.skipLineEnding();
        } else if (this.current === '#') {
            this.next();
            if (this.current === '|') {
                this.next();
                depth += 1;
            }
        } else if (this.current === '|') {
            this.next();
            if (this.current === '#') {
                this.next();
                depth -= 1;
                if (depth === 0) {
                    break;
                }
            }
        } else if (this.current === undefined) {
            this.error('unfinished nested comment');
        } else {
            this.next();
        }
    }
};

Lexer.prototype.scanUntilDelimiter = function () {
    var buffer = '';

    while (this.current && !this.isDelimiter(this.current)) {
        buffer += this.current;
        this.next();
    }

    return buffer;
};

Lexer.prototype.scanBoolean = function () {
    // <boolean> ::= #t
    //             | #f
    //             | #true
    //             | #false
    var value, buffer;

    buffer = this.scanUntilDelimiter();

    if (buffer === 't' || buffer === 'true') {
        value = true;
    } else if (buffer === 'f' || buffer === 'false') {
        value = false;
    } else {
        this.error('ill-formed boolean');
    }

    return {
        type: 'boolean',
        value: value,
        lineNumber: this.lineNumber
    };
};

Lexer.prototype.scanCharacter = function () {
    // <character> ::= #\<any character>
    //               | #\<character name>
    //               | #\x<hex scalar value>
    //
    // <character name> ::= alarm | backspace | delete
    //                    | escape | newline | null | return
    //                    | space | tab
    var buffer, code, value;

    this.next();

    if (this.current === 'x') {
        this.next();
        if (this.isHexDigit(this.current)) {
            buffer = '';
            while (this.isHexDigit(this.current)) {
                buffer += this.current;
                this.next();
            }
            code = parseInt(buffer, 16);
            value = String.fromCharCode(code);
        } else {
            value = 'x';
        }
    } else if (this.isLetter(this.current)) {
        buffer = '';
        while (this.current && !this.isDelimiter(this.current)) {
            buffer += this.current;
            this.next();
        }
        if (buffer.length === 1) {
            value = buffer;
        } else if (this.namedCharacters.hasOwnProperty(buffer)) {
            value = this.namedCharacters[buffer];
        } else {
            this.error('ill-formed character');
        }
    } else if (this.current === undefined) { // EOF
        this.error('ill-formed character');
    } else { // non-letter single character
        value = this.current;
        this.next();
    }

    return {
        type: 'character',
        value: value,
        lineNumber: this.lineNumber
    };
};

Lexer.prototype.namedCharacters = {
    'alarm'     : '\u0007',
    'backspace' : '\u0008',
    'delete'    : '\u007f',
    'escape'    : '\u001b',
    'newline'   : '\n',
    'null'      : '\0',
    'return'    : '\r',
    'space'     : ' ',
    'tab'       : '\t'
};

Lexer.prototype.scanString = function () {
    // <string> ::= "<string element>*"
    //
    // <string element> ::= <any character other than " or \>
    //                    | \a | \b | \t | \n | \r | \" | \\
    //                    | \<intraline whitespace><lineending>
    //                       <intraline whitespace>
    //                    | <inline hex escape>
    //
    var buffer = '',
        lineNumber = this.lineNumber;

    this.next();

    while (this.current !== '"') {
        if (this.current === undefined) {
            this.error('unfinished string');
        } else if (this.current === '\\') {
            this.next();
            if (this.isIntralineWhitespace(this.current)) {
                // A line ending which is preceded by \<intraline whitespace>
                // expands to nothing.
                // (along with any trailing intraline whitespace)
                while (this.isIntralineWhitespace(this.current)) {
                    this.next();
                }
                if (!this.isLineEnding(this.current)) {
                    this.error('unfinished string');
                }
                this.skipLineEnding();
                while (this.isIntralineWhitespace(this.current)) {
                    this.next();
                }
            } else {
                switch (this.current) {
                    case 'a': buffer += '\u0007'; break;
                    case 'b': buffer += '\u0008'; break;
                    case 't': buffer += '\t'; break;
                    case 'r': buffer += '\r'; break;
                    case 'n': buffer += '\n'; break;
                    case 'r': buffer += '\r'; break;
                    case '"': buffer += '"'; break;
                    case '\\': buffer += '\\'; break;
                    case 'x': buffer += this.scanInlineHexEscape(); continue;
                    default: this.error('invalid escape sequence');
                }
                this.next();
            }
        } else if (this.isLineEnding(this.current)) {
            buffer += '\n';
            this.skipLineEnding();
        } else {
            buffer += this.current;
            this.next();
        }
    }

    return {
        type: 'string',
        value: buffer,
        lineNumber: lineNumber
    };
};

Lexer.prototype.scanInlineHexEscape = function () {
    // <inline hex escape> ::= \x<hex scalar value>;
    // <hex scalar value> ::= <hex digit>+
    //
    //     \x0078; ==> x
    //      ^
    //      |
    //   current
    var buffer = '';

    this.next();

    while (this.current && this.isHexDigit(this.current)) {
        buffer += this.current;
        this.next();
    }
    if (this.current === ';') {
        this.next();
        return String.fromCharCode(parseInt(buffer, 16));
    } else {
        this.error('invalid escape sequence');
    }
};

Lexer.prototype.scanIdentifier = function () {
    // <identifier> ::= <initial> <subsequent>*
    //                | <vertical bar> <symbol element>* <vertical bar>
    //                | <peculiar identifier>
    var buffer;

    if (this.isInitialStart(this.current)) {
        buffer = this.scanInitial();
        buffer += this.scanSubsequents();
    } else if (this.current === '|') {
        this.next();
        buffer = this.scanSymbolElements();
    } else if (this.isPeculiarIdentifierStart(this.current)) {
        return this.scanPeculiarIdentifier();
    }

    return {
        type: 'identifier',
        value: buffer,
        lineNumber: this.lineNumber
    };
};

Lexer.prototype.isInitialStart = function (ch) {
    // <initial> ::= <letter>
    //             | <special initial>
    //             | <inline hex escape>
    return this.isLetter(ch)         ||
           this.isSpecialInitial(ch) ||
           ch === '\\';
};

Lexer.prototype.scanInitial = function () {
    // <initial> ::= <letter>
    //             | <special initial>
    //             | <inline hex escape>
    var ch = this.current;

    if (this.isLetter(ch)) {
        this.next();
        return ch;
    } else if (this.isSpecialInitial(ch)) {
        this.next();
        return ch;
    } else if (ch === '\\') {
        this.next();
        if (this.current === 'x') {
            return this.scanInlineHexEscape();
        } else {
            this.error('invalid identifier');
        }
    }
};

Lexer.prototype.scanSymbolElements = function () {
    // <symbol element> ::= <any character other than <vertical bar> or \>
    //                    | <inline hex escape>
    var ch, buffer = '';

    while (true) {
        ch = this.current;
        this.next();
        if (ch === '\\') {
            buffer += this.scanInlineHexEscape();
        } else if (ch === '|') {
            return buffer;
        } else if (ch === undefined) { // EOF
            this.error('unfinished identifier');
        } else {
            buffer += ch;
        }
    }
};

Lexer.prototype.scanSubsequents = function () {
    // <subsequent> ::= <initial>
    //                | <digit>
    //                | <special subsequent>
    var ch, buffer = '';

    while (true) {
        ch = this.current;
        if (this.isInitialStart(ch))  {
            buffer += this.scanInitial();
        } else if (this.isDigit(ch)) {
            this.next();
            buffer += ch;
        } else if (this.isSpecialSubsequent(ch)) {
            this.next();
            buffer += ch;
        } else {
            return buffer;
        }
    }
};

Lexer.prototype.scanPeculiarIdentifier = function () {
    // <peculiar identifier> ::= <explicit sign>
    //                         | <explicit sign> <sign subsequent> <subsequent>*
    //                         | <explicit sign> . <dot subsequent> <subsequent>*
    //                         | . <non-digit> <subsequent>*
    var buffer;

    if (this.isExplicitSign(this.current)) {
        buffer = this.current;
        this.next();
        if (this.isSignSubsequentStart(this.current)) {
            buffer += this.scanSignSubsequent();
            buffer += this.scanSubsequents();
        } else if (this.current === '.') {
            this.next();
            buffer += '.';
            buffer += this.scanDotSubsequent();
            buffer += this.scanSubsequents();
        }
    } else if (this.current === '.') {
        this.next();
        buffer = '.';
        if (this.isNonDigitStart(this.current)) {
            buffer += this.scanNonDigit();
            buffer += this.scanSubsequents();
        } else {
            this.error('invalid identifier');
        }
    }

    return {
        type: 'identifier',
        value: buffer,
        lineNumber: this.lineNumber
    };
};

Lexer.prototype.scanSignSubsequent = function () {
    // <sign subsequent> ::= <initial>
    //                     | <explicit sign>
    //                     | @
    var ch = this.current;
    if (this.isInitialStart(ch)) {
        return this.scanInitial();
    } else if (this.isExplicitSign(ch)) {
        this.next();
        return ch;
    } else if (ch === '@') {
        this.next();
        return ch;
    }
};

Lexer.prototype.isSignSubsequentStart = function (ch) {
    // <sign subsequent> ::= <initial>
    //                     | <explicit sign>
    //                     | @
    return this.isInitialStart(ch) ||
           this.isExplicitSign(ch) ||
           ch === '@';
};

Lexer.prototype.scanDotSubsequent = function () {
    // <dot subsequent> ::= <sign subsequent>
    //                    | .
    if (this.isSignSubsequentStart(this.current)) {
        return this.scanSignSubsequent();
    } else if (this.current === '.') {
        this.next();
        return '.';
    } else {
        throw new Error();
    }
};

Lexer.prototype.scanNonDigit = function () {
    // <non digit> ::= <dot subsequent>
    //               | <explicit sign>
    if (this.isDotSubSequentStart(this.current)) {
        return this.scanDotSubsequent();
    } else {
        return this.current;
    }
};

Lexer.prototype.isNonDigitStart = function (ch) {
    // <non digit> ::= <dot subsequent>
    //               | <explicit sign>
    return this.isDotSubSequentStart(ch) || this.isExplicitSign(ch);
};

Lexer.prototype.isDotSubSequentStart = function (ch) {
    // <dot subsequent> ::= <sign subsequent>
    //                    | .
    return this.isSignSubsequentStart(ch) || ch === '.';
};

Lexer.prototype.isPeculiarIdentifierStart = function (ch) {
    // <peculiar identifier> ::= <explicit sign>
    //                         | <explicit sign> <sign subsequent> <subsequent>*
    //                         | <explicit sign> . <dot subsequent> <subsequent>*
    //                         | . <non-digit> <subsequent>*
    return this.isExplicitSign(ch) || ch === '.';
};

Lexer.prototype.isSpecialInitial = function (ch) {
    return ch === '!' ||
           ch === '$' ||
           ch === '%' ||
           ch === '&' ||
           ch === '*' ||
           ch === '/' ||
           ch === ':' ||
           ch === '<' ||
           ch === '=' ||
           ch === '>' ||
           ch === '?' ||
           ch === '^' ||
           ch === '_' ||
           ch === '~';
};

Lexer.prototype.isSpecialSubsequent = function (ch) {
    // <special subsequent> ::= <explicit sign>
    //                        | .
    //                        | @
    return this.isExplicitSign(ch) ||
           ch === '.'              ||
           ch === '@';
};

Lexer.prototype.isExplicitSign = function (ch) {
    return ch === '+' || ch === '-';
};

Lexer.prototype.scanNumber = function () {
    // XXX: only support basic numbers so far.
    //
    // <decimal 10> ::= <uinteger 10> <suffix>
    //                | . <digit 10>+ <suffix>
    //                | <digit 10>+ . <digit 10>* <suffix>
    var whole, fraction, exponent;

    if (this.current === '.') { // decimal starting with dot
        this.next();
        if (!this.isDigit(this.current)) {
            this.error('ill-formed number');
        }
        whole = '0';
        fraction = this.scanDigits(10);
    } else if (this.isDigit(this.current)) {
        whole = this.scanDigits(10);
        if (this.current === '.') {
            this.next();
            fraction = this.scanDigits(10) || '0';
        }
    }

    whole = parseInt(whole, 10);
    fraction = parseFloat('0.' + fraction);
    exponent = this.scanSuffix();

    return {
        type: 'number',
        subtype: 'real',
        exact: false,
        value: (whole + fraction) * Math.pow(10, exponent)
    };
};

Lexer.prototype.scanPrefixedNumber = function () {
    this.error('prefixed number not supported');
};

//Lexer.prototype.scanComplex = function (radix) {
    //// <complex R> ::= <real R>
    ////               | <real R> @ <real R>
    ////               | <real R> + <ureal R> i
    ////               | <real R> - <ureal R> i
    ////               | <real R> + i
    ////               | <real R> - i
    ////               | <real R> <infinity> i
    ////               | + <ureal R> i
    ////               | - <ureal R> i
    ////               | <infinity> i
    ////               | + i
    ////               | - i
    ////
    //// <real R> ::= <sign> <ureal R>
    ////            | <infinity>
    ////
    //// <ureal R> ::= <uinteger R>
    ////             | <uinteger R> / <uinteger R>
    ////             | <decimal R>
    ////
    //// <decimal 10> ::= <uinteger 10> <suffix>
    ////                | . <digit 10>+ <suffix>
    ////                | <digit 10>+ . <digit 10>* <suffix>
    ////
    //// <uinteger R> ::= <digit R>+
    ////
    //// <suffix> ::= <empty>
    ////            | <exponent marker> <sign> <digit 10>+
    ////
    //// <exponent marker> ::= e | s | f | d | l
    ////
    //// <sign> ::= <empty> | + | -

    //var sign = 1; // 1 for postive and -1 for negative

    //if (this.current === '+') {
        //this.sign = 1;
        //this.next();
    //} else if (this.current === '-') {
        //this.sign = -1;
        //this.next();
    //}
//};

//Lexer.prototype.scanUreal = function (radix) {
    //// <ureal R> ::= <uinteger R>
    ////             | <uinteger R> / <uinteger R>
    ////             | <decimal R>
    ////
    //// <decimal 10> ::= <uinteger 10> <suffix>
    ////                | . <digit 10>+ <suffix>
    ////                | <digit 10>+ . <digit 10>* <suffix>
    //var buffer, first, second, i;

    //if (this.current === '.') { // decimal
        //if (radix !== 10) {
            //this.error('ill-formed number');
        //}
        //this.next();
        //if (!this.isDigit(this.current)) {
            //this.error('ill-formed number');
        //}
        //first = '0';
        //second = this.scanDigits(10);
    
    //} else if (this.isDigitOfRadix(this.current, radix)) {
        //buffer = this.scanDigits(radix);
        //first = parseInt(buffer, radix); // nominator or whole part

        //if (this.current === '/') {
            //this.next();
            //buffer = this.scanDigits(radix);
            //second = parseInt(buffer, radix); // denominator

            //return {
                //type: 'number',
                //subtype: 'rational',
                //exact: true,
                //value: first / second,
                //nominator: first,
                //denominator: second,
                //lineNumber: this.lineNumber
            //};
        //} else if (this.current === '.') {
            //this.next();
            //buffer = this.scanDigits(radix); // fraction part
            //// convert fraction part to float
            //second = 0;
            //for (i = 0; i < buffer.length; ++i) {
                //second += Math.pow(radix, -(i + 1)) * (buffer[i] - '0');
            //}

            //return {
                //type: 'number',
                //subtype: 'rational',
                //exact: false,
                //value: first + second,
                //lineNumber: this.lineNumber
            //};
        //} else { // no second part
            //return {
                //type: 'number',
                //subtype: 'integer',
                //exact: true,
                //value: first,
                //lineNumber: this.lineNumber
            //};
        //}
    //}
//};

Lexer.prototype.scanDigits = function (radix) {
    var buffer = '',
        checkRadix;

    switch (radix) {
        // XXX: be careful about `this`
        case 2: checkRadix = this.isBinaryDigit; break;
        case 8: checkRadix = this.isOctalDigit; break;
        case 16: checkRadix = this.isHexDigit; break;
        default: checkRadix = this.isDigit;
    }

    while (this.isDigit(this.current)) {
        if (!checkRadix(this.current)) {
            this.error('ill-formed number');
        }
        buffer += this.current;
        this.next();
    }

    return buffer;
};

//Lexer.prototype.scanDecimal = function () {
    //// <decimal 10> ::= <uinteger 10> <suffix>
    ////                | . <digit 10>+ <suffix>
    ////                | <digit 10>+ . <digit 10>* <suffix>
    //var whole, fraction, exponent;

    //if (this.current === '.') { // decimal starting with dot
    //} else if (this.isDigit(this.current)) {
        //if (!this.isDigit(this.current)) {
            //this.error('ill-formed number');
        //}
        //whole = this.scanDigits();
        //if (this.current === '.') {
            //this.next();
            //fraction = this.scanDigits(10) || '0';
        //}
    //}

    //whole = parseInt(whole, 10);
    //fraction = parseFloat('0.' + fraction);
    //exponent = this.scanSuffix();

    //return {
        //type: 'number',
        //subtype: 'real',
        //exact: false,
        //value: (whole + fraction) * Math.pow(10, exponent)
    //};
//};

Lexer.prototype.scanSuffix = function () {
    // <suffix> ::= <empty>
    //            | <exponent marker> <sign> <digit 10>+
    //
    // XXX: the precision is not implemented
    var exponent;

    if (this.current && this.isExponentMarker(this.current)) {
        this.next();
        if (this.current === '+' || this.current === '-') {
            this.next();
        }
        if (!(this.isDigit(this.current))) {
            this.error('ill-formed number');
        }
        exponent = this.scanDigits(10);
    }

    if (exponent) {
        return parseInt(exponent, 10);
    } else {
        return 0;
    }
};

Lexer.prototype.isExponentMarker = function (ch) {
    ch = ch.toLowerCase();
    return ch === 'e' ||
           ch === 's' ||
           ch === 'f' ||
           ch === 'd' ||
           ch === 'l';
};


//Lexer.prototype.isRealStart = function (ch) {
    //return ch === '+' || ch === '-';
//};

//Lexer.prototype.scanPrefixedNumber = function () {
    //// <number> ::= <num 2> | <num 8> | <num 10> | <num 16>
    ////
    //// <num R> ::= <prefix R> <complex R>
    ////
    //// <prefix R> ::= <radix R> <exactness>
    ////              | <exactness> <radix R>
    ////
    //// 6.2.5.
    //// If the written representation of a number has no exactness prefix,
    //// the constant is inexact if it contains a decimal point or an exponent.
    //// Otherwise, it is exact.
    //var isExact, radix,
        //preA, preB, // two prefixes
        //complex;

    //preA = this.current.toLowerCase();
    //switch (preA) {
        //case 'i': isExact = false; break;
        //case 'e': isExact = true; break;
        //case 'b': radix = 2; break;
        //case 'o': radix = 8; break;
        //case 'd': radix = 10; break;
        //case 'x': radix = 16; break;
        //default: throw new Error();
    //}

    //this.next();
    //if (this.current === '#') {
        //this.next();
        //if (this.current === undefined) {
            //throw new Error('Unexpected EOF');
        //}

        //preB = this.current.toLowerCase();
        //switch (preB) {
            //case 'i':
                //if (isExact !== undefined) { throw new Error(); }
                //isExact = false; break;
            //case 'e':
                //if (isExact !== undefined) { throw new Error(); }
                //isExact = true; break;
            //case 'b':
                //if (radix !== undefined) { throw new Error(); }
                //radix = 2; break;
            //case 'o':
                //if (radix !== undefined) { throw new Error(); }
                //radix = 8; break;
            //case 'd':
                //if (radix !== undefined) { throw new Error(); }
                //radix = 10; break;
            //case 'x':
                //if (radix !== undefined) { throw new Error(); }
                //radix = 16; break;
            //default: throw new Error();
        //}
        //this.next();

        //complex = this.scanComplex(radix);
    //} else {
    
    //}
//};

//Lexer.prototype.isRadixPrefix = function (ch) {
    //ch = ch.toLowerCase();
    //return ch === 'b' || ch === 'o' || ch === 'd' || ch === 'x';
//};

//Lexer.prototype.isExactnessPrefix = function (ch) {
    //ch = ch.toLowerCase();
    //return ch === 'e' || ch === 'i';
//};

exports.Lexer = Lexer;
