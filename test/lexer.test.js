var Lexer = require('../src/lexer').Lexer;

describe('Lexer', function () {
    it('should skip whitespace', function () {
        var lexer;

        lexer = new Lexer('               ');
        lexer.nextToken().should.eql({
            type: 'EOF',
            lineNumber: 1
        });

        lexer = new Lexer('\t\n\n    \n \t');
        lexer.nextToken().should.eql({
            type: 'EOF',
            lineNumber: 4
        });

        lexer = new Lexer('\n\r  \n \r\n');
        lexer.nextToken().should.eql({
            type: 'EOF',
            lineNumber: 5
        });
    });
});
