function Lexer(input) {
    this.source = input;
    this.length = input.length;
    this.index = 0;
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
    var ch, token;

    this.skipWhiteSpaceAndComment();

    // EOF
    if (this.index >= this.length) {
        return {
            type: 'EOF',
            lineNumber: this.lineNumber
        };
    }

    // identifier
    token = this.scanIdentifier();
    if (token) {
        return token;
    }

    // boolean
    token = this.scanBoolean();
    if (token) {
        return token;
    }

    // number
    token = this.scanNumber();
    if (token) {
        return token;
    }

    // character
    token = this.scanCharacter();
    if (token) {
        return token;
    }

    ch = this.source[this.index++];

    if (ch === '(') {
        return {
            type: 'L_PAREN',
            value: '(',
            lineNumber: this.lineNumber
        };
    }

    if (ch === ')') {
        return {
            type: 'R_PAREN',
            value: ')',
            lineNumber: this.lineNumber
        };
    }
};

Lexer.prototype.skipWhiteSpaceAndComment = function () {
    // <comment> ::= ; <all subsequent characters up to a line break>
    //             | <nested comment>
    //             | #; <atmosphere> <datum>
    //
    // <nested comment> ::= #| <comment text>
    //                         <comment cont>* |#
    //
    // <comment text> ::= <character sequence not containing
    //                     #| or |#>
    //
    // <comment cont> ::= <nested comment> <comment text>
    //
    // <atmosphere> ::= <whitespace> | <comment>
    var source = this.source,
        length = this.length,
        isLineComment = false,
        isBlockComment = false,
        blockCommentDepth,
        ch,
        next;

    while (this.index < this.length) {
        ch = source[this.index];
        
        if (isLineComment) {
            ++this.index;
            next = source[this.index];

            if (this.isLineEnding(ch)) {
                if (ch === '\r' && next === '\n') {
                    ++this.index;
                }
                ++this.lineNumber;
                isLineComment = false;
            }
        } else if (isBlockComment) {
            if (this.isLineEnding(ch)) {
                if (ch === '\r' && source[this.index + 1] === '\n') {
                    ++this.index;
                }
                ++this.lineNumber;
                ++this.index;
                if (this.index >= length) {
                    throw new Error();
                }
            } else {
                ++this.index;
                if (this.index >= length) {
                    throw new Error();
                }
                if (ch === '|') {
                    ch = source[this.index];
                    if (ch === '#') {
                        ++this.index;
                        if (this.index >= length) {
                            throw new Error();
                        }
                        --blockCommentDepth;
                        if (blockCommentDepth === 0) {
                            isBlockComment = false;
                        }
                    }
                } else if (ch === '#') {
                    ch = source[this.index];
                    if (ch === '|') {
                        ++this.index;
                        if (this.index >= length) {
                            throw new Error();
                        }
                        ++blockCommentDepth;
                    }
                }
            }
        } else if (ch === ';') {
            ++this.index;
            isLineComment = true;
        } else if (ch === '#') {
            ch = source[this.index + 1];
            if (ch === '|') {
                this.index += 2;
                isBlockComment = true;
                blockCommentDepth = 1;
                if (this.index >= length) {
                    throw new Error();
                }
            } else {
                break;
            }
        } else if (this.isWhiteSpace(ch)) {
            ++this.index;
        } else if (this.isLineEnding(ch)) {
            ++this.index;
            if (ch === '\r' && source[this.index] === '\n') {
                ++this.index;
            }
            ++this.lineNumber;
        } else { // TODO: check datum comment
            break;
        }
    }
};

Lexer.prototype.isWhiteSpace = function (ch) {
    // <whitespace> ::= <intraline whitespace>
    //                | <newline>
    //                | <return>
    //
    // <intraline whitespace> ::= <space or tab>
    //
    // In order to support line number, <newline> and <return>
    // are moved into the <line ending> definition.
    return ch === ' '  || ch === '\t';
};

Lexer.prototype.isLineEnding = function (ch) {
    // The following definition is not part of r7rs.
    // It's included in order to count line number.
    //
    // <line ending> ::= <linefeed>
    //                 | <carriage return>
    //                 | <carriage return> <linefeed>
    //                 | <next line>
    //                 | <carriage return> <next line>
    //                 | <line separator>
    return ch === '\n' || ch === '\r';
};

Lexer.prototype.scanIdentifier = function () {
    // <identifier> ::= <initial> <subsequent>*
    //                | <vertical bar> <symbol element>* <vertical bar>
    //                | <peculiar identifier>
    var source = this.source,
        buffer,
        ch;

    ch = source[this.index];
    
    if (this.isInitialStart(ch)) {
        buffer = this.scanInitial();
        buffer += this.scanSubsequents();
    } else if (ch === '|') {
        ++this.index;
        buffer = this.scanSymbolElements();
    } else if (this.isPeculiarIdentifierStart(ch)) {
        buffer = this.scanPeculiarIdentifier();
    } else {
        throw new Error();
    }

    if (buffer) {
        return {
            type: 'identifier',
            value: buffer,
            lineNumber: this.lineNumber
        };
    } else {
        return null;
    }
};

Lexer.prototype.scanInitial = function () {
    // <initial> ::= <letter>
    //             | <special initial>
    //             | <inline hex escape>
    var ch = this.source[this.index];
    if (this.isLetter(ch)) {
        ++this.index;
        return ch;
    } else if (this.isSpecialInitial(ch)) {
        ++this.index;
        return ch;
    } else if (ch === '\\') {
        return this.scanInlineHexEscape();
    }
};

Lexer.prototype.scanSubsequents = function () {
    // <subsequent> ::= <initial>
    //                | <digit>
    //                | <special subsequent>
    var source = this.source,
        buffer = '',
        ch;

    while (true) {
        ch = source[this.index];
        if (this.isInitialStart(ch))  {
            buffer += this.scanInitial();
        } else if (this.isDigit(ch)) {
            ++this.index;
            buffer += ch;
        } else if (this.isSpecialSubsequent(ch)) {
            ++this.index;
            buffer += ch;
        } else {
            return buffer;
        }
    }
};

Lexer.prototype.scanInlineHexEscape = function () {
    // <inline hex escape> ::= \x<hex scalar value>;
    // <hex scalar value> ::= <hex digit>+
    //
    //     \x0078; ==> x
    //     ^
    //     |
    //   index
    var source = this.source,
        length = this.length,
        buffer = '',
        code,
        ch;

    ch = source[++this.index];
    if (ch !== 'x') {
        throw new Error();
    }

    ch = source[++this.index];
    while (this.isHexDigit(ch)) {
        buffer += ch;
        ++this.index;
        if (this.index >= length) {
            throw new Error();
        }
        ch = source[this.index];
    }
    if (source[this.index] === ';') {
        ++this.index;
        return String.fromCharCode(parseInt(buffer, 16));
    }
};

Lexer.prototype.scanPeculiarIdentifier = function () {
    // <peculiar identifier> ::= <explicit sign>
    //                         | <explicit sign> <sign subsequent> <subsequent>*
    //                         | <explicit sign> . <dot subsequent> <subsequent>*
    //                         | . <non-digit> <subsequent>*
    var source = this.source,
        buffer,
        ch,
        next;

    ch = source[this.index];
    if (this.isExplicitSign(ch)) {
        ++this.index;
        buffer = ch;
        next = source[this.index + 1];
        if (this.isSignSubsequentStart(next)) {
            buffer += this.scanSignSubsequent();
            buffer += this.scanSubsequents();
        } else if (next === '.') {
            ++this.index;
            buffer += '.';
            buffer += this.scanDotSubsequent();
            buffer += this.scanSubsequents();
        } else {
            return ch;
        }
    } else if (ch === '.') {
        next = source[this.index + 1];
        if (this.isNonDigitStart(next)) {
            ++this.index;
            buffer = '.';
            buffer += this.scanNonDigit();
            buffer += this.scanSubsequents();
        }
    }
    return buffer;
};

Lexer.prototype.scanSignSubsequent = function () {
    // <sign subsequent> ::= <initial>
    //                     | <explicit sign>
    //                     | @
    var ch = this.source[this.index];
    if (this.isInitialStart(ch)) {
        return this.scanInitial();
    } else if (this.isExplicitSign(ch)) {
        ++this.index;
        return ch;
    } else if (ch === '@') {
        ++this.index;
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
    var ch = this.source[this.index];
    if (this.isSignSubsequentStart(ch)) {
        return this.scanSignSubsequent();
    } else if (ch === '.') {
        ++this.index;
        return '.';
    } else {
        throw new Error();
    }
};

Lexer.prototype.scanNonDigit = function () {
    // <non digit> ::= <dot subsequent>
    //               | <explicit sign>
    var ch = this.source[this.index];
    if (this.isDotSubSequentStart(ch)) {
        return this.scanDotSubsequent();
    } else {
        return ch;
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

Lexer.prototype.scanSymbolElements = function () {
    // <symbol element> ::= <any character other than <vertical bar> or \>
    //                    | <inline hex escape>
    var source = this.source,
        length = this.length,
        buffer = '',
        ch;

    while (true) {
        ch = source[this.index];
        if (ch === '\\') {
            buffer += this.scanInlineHexEscape();
        } else if (ch === '|') {
            ++this.index;
            return buffer;
        } else {
            ++this.index;
            if (this.index >= length) {
                throw new Error();
            }
            buffer += ch;
        }
    }
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

Lexer.prototype.isInitialStart = function (ch) {
    // <initial> ::= <letter>
    //             | <special initial>
    //             | <inline hex escape>
    return this.isLetter(ch)         ||
           this.isSpecialInitial(ch) ||
           ch === '\\';
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

exports.Lexer = Lexer;
