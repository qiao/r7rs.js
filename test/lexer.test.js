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

        lexer = new Lexer('#falsy');
        (function () {
            lexer.nextToken();
        }).should.throw();
    });


    it('should scan character', function () {
        lexer = new Lexer('#\\ ');
        lexer.nextToken().should.eql({
            type: 'character',
            value: ' ',
            lineNumber: 1
        });
    
        lexer = new Lexer('#\\n #\\space #\\tab');
        lexer.nextToken().should.eql({
            type: 'character',
            value: 'n',
            lineNumber: 1
        });
        lexer.nextToken().should.eql({
            type: 'character',
            value: ' ',
            lineNumber: 1
        });
        lexer.nextToken().should.eql({
            type: 'character',
            value: '\t',
            lineNumber: 1
        });

        lexer = new Lexer('#\\x30#\\n;\n');
        lexer.nextToken().should.eql({
            type: 'character',
            value: '0',
            lineNumber: 1
        });
        lexer.nextToken().should.eql({
            type: 'character',
            value: 'n',
            lineNumber: 1
        });
        lexer.nextToken().should.eql({
            type: 'EOF',
            lineNumber: 2
        });
    });

    it('should scan string', function () {
        lexer = new Lexer('"The word \\\"recursion\\\" has many meanings."');
        lexer.nextToken().should.eql({
            type: 'string',
            value: 'The word \"recursion\" has many meanings.',
            lineNumber: 1
        });

        lexer = new Lexer('"\\x03b1; is alpha.\n"');
        lexer.nextToken().should.eql({
            type: 'string',
            value: '\u03b1 is alpha.\n',
            lineNumber: 1
        });

        lexer = new Lexer('"Here\'s a text \\   \n containing just one line"');
        lexer.nextToken().should.eql({
            type: 'string',
            value: 'Here\'s a text containing just one line',
            lineNumber: 1
        });
    });

    it('should scan parenthesis', function () {
        lexer = new Lexer('(lambda (x) (display x))\n');
        lexer.nextToken().should.eql({
            type: '(',
            lineNumber: 1
        });
        lexer.nextToken().should.eql({
            type: 'identifier',
            value: 'lambda',
            lineNumber: 1
        });
        lexer.nextToken().should.eql({
            type: '(',
            lineNumber: 1
        });
        lexer.nextToken().should.eql({
            type: 'identifier',
            value: 'x',
            lineNumber: 1
        });
        lexer.nextToken().should.eql({
            type: ')',
            lineNumber: 1
        });
        lexer.nextToken().should.eql({
            type: '(',
            lineNumber: 1
        });
        lexer.nextToken().should.eql({
            type: 'identifier',
            value: 'display',
            lineNumber: 1
        });
        lexer.nextToken().should.eql({
            type: 'identifier',
            value: 'x',
            lineNumber: 1
        });
        lexer.nextToken().should.eql({
            type: ')',
            lineNumber: 1
        });
        lexer.nextToken().should.eql({
            type: ')',
            lineNumber: 1
        });
        lexer.nextToken().should.eql({
            type: 'EOF',
            lineNumber: 2
        });
    });
});
