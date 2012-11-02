function Lexer(input) {
    this.source = input;
    this.length = input.length;
    this.index = 0;
    this.lineNumber = 0;
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
        isLineComment = false,
        isBlockComment = false,
        ch,
        next,
        depth;

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
            ++this.index;
            next = source[this.index];

            if (this.isLineEnding(ch)) {
                if (ch === '\r' && next === '\n') {
                    ++this.index;
                }
                ++this.lineNumber;
            } else {

            }
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
    // It's included in order to count the lines.
    //
    // <line ending> ::= <linefeed>
    //                 | <carriage return>
    //                 | <carriage return> <linefeed>
    //                 | <next line>
    //                 | <carriage return> <next line>
    //                 | <line separator>
    return ch === '\n' || ch === '\r';
};

exports.Lexer = Lexer;
