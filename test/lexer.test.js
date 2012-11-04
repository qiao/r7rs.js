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

    it('should scan inline hex escape', function () {
        lexer = new Lexer('\\x30;');
        lexer.scanInlineHexEscape().should.equal('0');

        lexer = new Lexer('\\x0078;');
        lexer.scanInlineHexEscape().should.equal('x');
    });

    it('should scan identifier', function () {
        ['lambda',
          'list->vector',
          '+',
          '<=?',
          '->string',
          'the-word-recursion-has-many-meanings',
          'q',
          '+soup+',
          'V17a',
          'a34kTMNs',
          '...'].forEach(function (id) {
              lexer = new Lexer(id);
              lexer.nextToken().should.eql({
                  type: 'identifier',
                  value: id,
                  lineNumber: 1
              });
              lexer.nextToken().should.eql({
                  type: 'EOF',
                  lineNumber: 1
              });
          });

          ['two\\x20;words',
           '|two words|',
           '|two\\x20;words|'].forEach(function (id) {
              lexer = new Lexer(id);
              lexer.nextToken().should.eql({
                  type: 'identifier',
                  value: 'two words',
                  lineNumber: 1
              });
              lexer.nextToken().should.eql({
                  type: 'EOF',
                  lineNumber: 1
              });
          });

          lexer = new Lexer(';\ntwo words;\r\n');
          lexer.nextToken().should.eql({
              type: 'identifier',
              value: 'two',
              lineNumber: 2
          });
          lexer.nextToken().should.eql({
              type: 'identifier',
              value: 'words',
              lineNumber: 2
          });
          lexer.nextToken().should.eql({
              type: 'EOF',
              lineNumber: 3
          });
    });

    it('should scan boolean', function () {
        lexer = new Lexer('#t');
        lexer.nextToken().should.eql({
            type: 'boolean',
            value: true,
            lineNumber: 1
        });

        lexer = new Lexer('#false');
        lexer.nextToken().should.eql({
            type: 'boolean',
            value: false,
            lineNumber: 1
        });

        lexer = new Lexer('#false  ;\n#true\r\n');
        lexer.nextToken().should.eql({
            type: 'boolean',
            value: false,
            lineNumber: 1
        });
        lexer.nextToken().should.eql({
            type: 'boolean',
            value: true,
            lineNumber: 2
        });
        lexer.nextToken().should.eql({
            type: 'EOF',
            lineNumber: 3
        });
    });
});
