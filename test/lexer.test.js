var Lexer = require('../src/lexer').Lexer;

describe('Lexer', function () {

    var lexer;

    it('should skip whitespace', function () {
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

    it('should skip comments', function () {
        lexer = new Lexer('  ; line comment');
        lexer.nextToken().should.eql({
            type: 'EOF',
            lineNumber: 1
        });

        lexer = new Lexer('  ;\n;;;xxx');
        lexer.nextToken().should.eql({
            type: 'EOF',
            lineNumber: 2
        });

        lexer = new Lexer('#||#\n;');
        lexer.nextToken().should.eql({
            type: 'EOF',
            lineNumber: 2
        });

        lexer = new Lexer('\t\n;\n#|hello#||##|world|#!|#\n;');
        lexer.nextToken().should.eql({
            type: 'EOF',
            lineNumber: 4
        });
    });

    it('should throw error on unclosed block comment', function () {
        lexer = new Lexer('#|');
        (function () {
            lexer.nextToken();
        }).should.throw();

        lexer = new Lexer(';\n#|hello #||#|');
        (function () {
            lexer.nextToken();
        }).should.throw();
    });
});
