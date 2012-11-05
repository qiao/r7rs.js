function Lexer(input) {
    this.source = input;
    this.length = input.length;
    this.index = 0;
    this.current = input[0];
    this.lineNumber = 1;
}

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
    var type;

    while (this.current) {
        switch (this.current) {
            case '\n': case '\r':
                this.skipLineEnding();
                break;
            case ' ': case '\t':
                this.consume();
                break;
            case ';': // inline comment
                this.skipInlineComment();
                break;
            case '#':
                this.consume();
                switch (this.current) {
                    case '|': // #|
                        this.skipNestedComment();
                        break;
                    case 't': case 'f': // #t | #true | #f | #false
                        return this.scanBoolean();
                    case '\\':
                        return this.scanCharacter();
                    case '(': // #(
                        return {
                            type: '#(',
                            lineNumber: this.lineNumber
                        };
                    case 'u': // #u8(
                        return this.scanByteVector();
                }
                break;
            case '(': case ')': case '\'': case '`':
                type = this.current;
                this.consume();
                return {
                    type: type,
                    lineNumber: this.lineNumber
                };
            case ',':
                this.consume();
                if (this.current === '@') {
                    this.consume();
                    type = ',@';
                } else {
                    type = ',';
                }
                return {
                    type: type,
                    lineNumber: this.lineNumber
                };
            case '"':
                return this.scanString();
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
Lexer.prototype.consume = function () {
    this.current = this.source[++this.index];
};

Lexer.prototype.isLetter = function (ch) {
    return (ch >= 'a' && ch <= 'z')  ||
           (ch >= 'A' && ch <= 'Z');
};

Lexer.prototype.isDigit = function (ch) {
    return ch >= '0' && ch <= '9';
};

Lexer.prototype.isHexDigit = function (ch) {
    return '0123456789abcdefABCDEF'.indexOf(ch) >= 0;
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

Lexer.prototype.isAtmosphereStart = function (ch) {
    // <atmosphere> ::= <whitespace>
    //                | <comment>
    return this.isWhiteSpace(ch) ||
           this.isCommentStart(ch);
};

Lexer.prototype.isCommentStart = function (ch) {
    return ch === ';' ||
           ch === '#';
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
Lexer.prototype.skipLineEnding = function () {
    var old = this.current;
    this.consume();
    if (old === '\r' && this.current === '\n') {
        this.consume();
    }
    this.lineNumber += 1;
};

Lexer.prototype.skipInlineComment = function () {
    while (!this.isLineEnding(this.current) && this.current) {
        this.consume();
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

    this.consume();

    while (true) {
        if (this.current === '\r' || this.current === '\n') {
            this.skipLineEnding();
        } else if (this.current === '#') {
            this.consume();
            if (this.current === '|') {
                this.consume();
                depth += 1;
            }
        } else if (this.current === '|') {
            this.consume();
            if (this.current === '#') {
                this.consume();
                depth -= 1;
                if (depth === 0) {
                    break;
                }
            }
        } else if (this.current === undefined) {
            throw new Error('Unexpected EOF');
        } else {
            this.consume();
        }
    }
};

Lexer.prototype.scanBoolean = function () {
    // <boolean> ::= #t
    //             | #f
    //             | #true
    //             | #false
    var value, buffer = '';

    while (this.current && !this.isDelimiter(this.current)) {
        buffer += this.current;
        this.consume();
    }

    if (buffer === 't' || buffer === 'true') {
        value = true;
    } else if (buffer === 'f' || buffer === 'false') {
        value = false;
    } else {
        throw new Error();
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

    this.consume();

    if (this.current === 'x') {
        this.consume();
        if (this.isHexDigit(this.current)) {
            buffer = '';
            while (this.isHexDigit(this.current)) {
                buffer += this.current;
                this.consume();
            }
            code = parseInt(buffer, 16);
            value = String.fromCharCode(code);
        } else {
            value = 'x';
        }
    } else if (this.isLetter(this.current)) {
        buffer = '';
        while (!this.isTokenEnd(this.current)) {
            buffer += this.current;
            this.consume();
        }
        if (buffer.length === 1) {
            value = buffer;
        } else if (buffer in this.namedCharacters) {
            value = this.namedCharacters[buffer];
        } else {
            throw new Error('Bad character constant');
        }
    } else if (this.current === undefined) { // EOF
        throw new Error('Expected a character after #\\');
    } else { // non-letter single character
        value = this.current;
        this.consume();
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

    this.consume();

    while (this.current !== '"') {
        if (this.current === undefined) {
            throw new Error('Unexpected EOF');
        } else if (this.current === '\\') {
            this.consume();
            if (this.isIntralineWhitespace(this.current)) {
                // A line ending which is preceded by \<intraline whitespace>
                // expands to nothing.
                // (along with any trailing intraline whitespace)
                this.consume();
                while (!this.isLineEnding(this.current)) {
                    this.consume();
                }
                if (this.current === undefined) {
                    throw new Error('Unexpected EOF');
                }
                this.skipLineEnding();
                while (this.isIntralineWhitespace(this.current)) {
                    this.consume();
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
                }
                this.consume();
            }
        } else if (this.isLineEnding(this.current)) {
            buffer += '\n';
            this.skipLineEnding();
        } else {
            buffer += this.current;
            this.consume();
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

    this.consume();

    while (this.current && this.isHexDigit(this.current)) {
        buffer += this.current;
        this.consume();
    }
    if (this.current === ';') {
        this.consume();
        return String.fromCharCode(parseInt(buffer, 16));
    } else {
        throw new Error();
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
        this.consume();
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
        this.consume();
        return ch;
    } else if (this.isSpecialInitial(ch)) {
        this.consume();
        return ch;
    } else if (ch === '\\') {
        this.consume();
        if (this.current === 'x') {
            return this.scanInlineHexEscape();
        } else {
            throw new Error();
        }
    }
};

Lexer.prototype.scanSymbolElements = function () {
    // <symbol element> ::= <any character other than <vertical bar> or \>
    //                    | <inline hex escape>
    var ch, buffer = '';

    while (true) {
        ch = this.current;
        this.consume();
        if (ch === '\\') {
            buffer += this.scanInlineHexEscape();
        } else if (ch === '|') {
            return buffer;
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
            this.consume();
            buffer += ch;
        } else if (this.isSpecialSubsequent(ch)) {
            this.consume();
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
        this.consume();
        if (this.isSignSubsequentStart(this.current)) {
            buffer += this.scanSignSubsequent();
            buffer += this.scanSubsequents();
        } else if (this.current === '.') {
            this.consume();
            buffer += '.';
            buffer += this.scanDotSubsequent();
            buffer += this.scanSubsequents();
        }
    } else if (this.current === '.') {
        this.consume();
        buffer = '.';
        if (this.isNonDigitStart(this.current)) {
            buffer += this.scanNonDigit();
            buffer += this.scanSubsequents();
        } else {
            throw new Error();
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
        this.consume();
        return ch;
    } else if (ch === '@') {
        this.consume();
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
        this.consume();
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

Lexer.prototype.isTokenEnd = function (ch) {
    return this.isDelimiter(ch)       ||
           this.isAtmosphereStart(ch) ||
           ch === undefined; // when reached EOF
};

exports.Lexer = Lexer;
