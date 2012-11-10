/**
 * R7RS Scheme parser written using [PEG.js](https://github.com/dmajda/pegjs).
 */

{

var objects      = require('./objects'),
    ByteVector   = objects.ByteVector,
    Char         = objects.Char,
    Complex      = objects.Complex,
    Nil          = objects.Nil,
    Pair         = objects.Pair,
    SchemeString = objects.SchemeString,
    Symbol       = objects.Symbol,
    Vector       = objects.Vector;
}

start
    = __ ds:datum* { return ds; }

datum 'datum'
    = __ (d:simpleDatum _) __  { return d; }
    / compoundDatum
    / d:(label '=' datum) { return d; }
    / d:(label '#') { return d; }

simpleDatum
    = boolean
    / number 
    / character   
    / string 
    / symbol
    / bytevector

symbol
    = id:identifier { return new Symbol(id); }

compoundDatum
    = list
    / vector

list
    = __ '(' __ ds:datum* __ ')' __ {
          var i, pair = Nil;
          for (i = ds.length - 1; i >= 0; --i) {
              pair = new Pair(ds[i], pair);
          }
          return pair;
      }
    / __ '(' __ ds:datum+ __ ('.' _) __ d:datum __ ')' __ {
          var i, len = ds.length, pair = new Pair(ds[len - 1], d);
          for (i = len - 2; i >= 0; --i) {
              pair = new Pair(ds[i], pair);
          }
          return pair;
      }
    / __ a:abbreviation __ { return a; }

abbreviation
    = a:abbrevPrefix d:datum {
          var symbol;
          switch (a) {
              case ',@': symbol = new Symbol('unquote-splicing'); break;
              case ',':  symbol = new Symbol('unquote'); break;
              case '\'': symbol = new Symbol('quote'); break;
              case '`':  symbol = new Symbol('quasiquote'); break; 
          }
          return new Pair(symbol, new Pair(d, Nil));
      }

abbrevPrefix
    = ',@'
    / ['`,]

vector
    = __ '#(' __ ds:datum* __ ')' __ { return new Vector(ds); }

label
    = '#' digit10+

delimiter 'delimiter'
    = whitespace
    / '('
    / ')'
    / '"'
    / ';'
    / '|'

EOF
    = !.

_
    = &(delimiter / EOF)

__
    = intertokenSpace

intralineWhitespace
    = [ \t]

whitespace
    = intralineWhitespace
    / [\n\r]

linebreak 'linebreak'
    = '\r'? '\n'

comment 'comment'
    = ';' (!linebreak .)*
    / '#;' whitespace* datum

/*
nestedComment
    = '#|' commentText commentCont* '|#'

commentText
    = <character sequence not containing #| or |#>

commentCont
    = nestedComment commentText
*/

atmosphere
    = whitespace
    / comment

intertokenSpace
    = atmosphere*

identifier
    = '|' s:symbolElement* '|' { return s.join(''); }
    / peculiarIdentifier
    / i:initial s:subsequent*  { return i + s.join(''); }

initial
    = letter
    / specialInitial
    / inlineHexEscape

letter
    = [a-z]i

specialInitial
    = [!$%&*/:<=>?^_~]

subsequent
    = initial
    / digit
    / specialSubsequent

digit
    = [0-9]

hexDigit
    = digit
    / [a-f]i

explicitSign
    = [+-]

specialSubsequent
    = explicitSign
    / [.@]

inlineHexEscape
    = '\\x' h:hexScalarValue ';' { return String.fromCharCode(h); }

hexScalarValue
    = h:hexDigit+ { return parseInt(h.join(''), 16); }

peculiarIdentifier
    = e:explicitSign '.' d:dotSubsequent s:subsequent* {
          return e + '.' + d + s.join('');
      }
    / e:explicitSign ss:signSubsequent s:subsequent* {
          return e + ss + s.join('');
      }
    / explicitSign
    / '.' n:nonDigit ss:subsequent* {
          return '.' + n + ss.join('');
      }
    
nonDigit
    = dotSubsequent
    / explicitSign

dotSubsequent
    = '.'
    / signSubsequent

signSubsequent
    = '@'
    / explicitSign
    / initial

symbolElement
    = inlineHexEscape
    / [^|\\]

boolean 'boolean'
    = ('#true' / '#t') { return true;  }
    / ('#false' / '#f') { return false; }

character 'character'
    = '#\\x' h:hexScalarValue  { return new Char(String.fromCharCode(h)); }
    / '#\\'  c:characterName   { return new Char(c); }
    / '#\\'  c:.               { return new Char(c); }

characterName
    = 'alarm'      { return '\u0007'; }
    / 'backspace'  { return '\u0008'; }
    / 'delete'     { return '\u007f'; }
    / 'escape'     { return '\u001b'; }
    / 'newline'    { return '\n';     }
    / 'null'       { return '\0';     }
    / 'return'     { return '\r';     }
    / 'space'      { return ' ';      }
    / 'tab'        { return '\t';     }

string 'string'
    = '"' ss:stringElement* '"' { return new SchemeString(ss.join('')); }

stringElement
    = '\\a'    { return '\u0007'; }
    / '\\b'    { return '\u0008'; }
    / '\\t'    { return '\t';     }
    / '\\n'    { return '\n';     }
    / '\\r'    { return '\r';     }
    / '\\"'    { return '"';      }
    / '\\\\'   { return '\\';     }
    / '\\' intralineWhitespace* linebreak intralineWhitespace* { return ''; }
    / inlineHexEscape
    / [^"\\]

bytevector
    = __ '#u8(' __ bs:byte* __ ')' __ { return new ByteVector(bs); }

byte
    = __ n:(num255 _) __  { return parseInt(n.join(''), 10); }

num255 
    = '25' [0-5]
    / '2' [0-4] [0-9]
    / '1' [0-9] [0-9]
    / [0-9] [0-9]?

number 'number'
    = n:(num2 / num8 / num10 / num16) _ { return n; }

num2 'binary number'
    = prefix2 c:complex2 { return c; }

complex2 
    = radius:real2 '@' angle:real2 {
          var real = Math.cos(angle) * radius,
              imag = Math.sin(angle) * radius;
          return new Complex(real, imag);
      }           
    / i:infinity 'i'              { return new Complex(0, i);  }
    / r:real2 '+' i:ureal2 'i'    { return new Complex(r, i);  }
    / r:real2 '-' i:ureal2 'i'    { return new Complex(r, -i); }
    / r:real2 i:infinity 'i'      { return new Complex(r, i);  }
    / r:real2 '+i'                { return new Complex(r, 1);  }
    / r:real2 '-i'                { return new Complex(r, -1); }
    / '+' i:ureal2 'i'            { return new Complex(0, i);  }
    / '-' i:ureal2 'i'            { return new Complex(0, -i); }
    / r:real2                     { return r;                  }
    / '+i'                        { return new Complex(0, 1);  }
    / '-i'                        { return new Complex(0, -1); }
    
real2
    = infinity
    / s:sign u:ureal2 { return s === '-' ? -u : u; }

ureal2
    = numer:uinteger2 '/' denom:uinteger2 { return numer / denom; }
    / uinteger2

uinteger2
    = ds:digit2+ { return parseInt(ds.join(''), 2); }

prefix2 
    = radix2 exactness
    / exactness radix2

num8
    = prefix8 c:complex8 { return c; }

complex8 
    = radius:real8 '@' angle:real8 {
          var real = Math.cos(angle) * radius,
              imag = Math.sin(angle) * radius;
          return new Complex(real, imag);
      }
    / i:infinity 'i'               { return new Complex(0, i);  }
    / r:real8 '+' i:ureal8 'i'     { return new Complex(r, i);  }
    / r:real8 '-' i:ureal8 'i'     { return new Complex(r, -i); }
    / r:real8 i:infinity 'i'       { return new Complex(r, i);  }
    / r:real8 '+i'                 { return new Complex(r, 1);  }
    / r:real8 '-i'                 { return new Complex(r, -1); }
    / '+' i:ureal8 'i'             { return new Complex(0, i);  }
    / '-' i:ureal8 'i'             { return new Complex(0, -i); }
    / r:real8                      { return r;                  }
    / '+i'                         { return new Complex(0, 1);  }
    / '-i'                         { return new Complex(0, -1); }
    
real8
    = infinity
    / s:sign u:ureal8 { return s === '-' ? -u : u; }
    

ureal8
    = numer:uinteger8 '/' denom:uinteger8 { return numer / denom; }
    / uinteger8

uinteger8
    = ds:digit8+ { return parseInt(ds.join(''), 8); }

prefix8 
    = radix8 exactness
    / exactness radix8

num10
    = prefix10 c:complex10 { return c; }

complex10
    = radius:real10 '@' angle:real10 {
          var real = Math.cos(angle) * radius,
              imag = Math.sin(angle) * radius;
          return new Complex(real, imag);
      }
    / i:infinity 'i'                { return new Complex(0, i);  }
    / r:real10 '+' i:ureal10 'i'    { return new Complex(r, i);  }
    / r:real10 '-' i:ureal10 'i'    { return new Complex(r, -i); }
    / r:real10 i:infinity 'i'       { return new Complex(r, i);  }
    / r:real10 '+i'                 { return new Complex(r, 1);  }
    / r:real10 '-i'                 { return new Complex(r, -1); }
    / '+' i:ureal10 'i'             { return new Complex(0, i);  }
    / '-' i:ureal10 'i'             { return new Complex(0, -i); }
    / r:real10                      { return r;                  } 
    / '+i'                          { return new Complex(0, 1);  }
    / '-i'                          { return new Complex(0, -1); }
    

real10
    = infinity
    / s:sign u:ureal10 { return s === '-' ? -u : u; }
    

ureal10
    = numer:uinteger10 '/' denom:uinteger10 { return numer / denom; } 
    / decimal10
    / uinteger10

decimal10
    = '.' ds:digit10+ s:suffix {
          var num = parseFloat('.' + ds.join(''));
          if (s) {
              num *= Math.pow(10, s);
          }
          return num;
      }
    / whole:digit10+ '.' fraction:digit10* s:suffix {
          var num = parseInt(whole.join(''), 10) + parseFloat('.' + fraction.join(''));
          if (s) {
              num *= Math.pow(10, s);
          }
          return num;
      }
    / u:uinteger10 s:suffix {
          if (s) {
              u *= Math.pow(10, s);
          }
          return u;
      }

suffix
    = e:exponentMarker s:sign ds:digit10+ {
          return parseInt(ds.join(''), 10) * (s === '-' ? -1: 1);
      }
    / empty

exponentMarker
    = [esfdl]

uinteger10
    = ds:digit10+ { return parseInt(ds.join(''), 10); }

prefix10
    = radix10 exactness
    / exactness radix10

num16
    = prefix16 c:complex16 { return c; }

complex16
    = radius:real16 '@' angle:real16 {
          var real = Math.cos(angle) * radius,
              imag = Math.sin(angle) * radius;
          return new Complex(real, imag);
      }
    / i:infinity 'i'                { return new Complex(0, i);  }
    / r:real16 '+' i:ureal16 'i'    { return new Complex(r, i);  }
    / r:real16 '-' i:ureal16 'i'    { return new Complex(r, -i); }
    / r:real16 i:infinity 'i'       { return new Complex(r, i);  }
    / r:real16 '+i'                 { return new Complex(r, 1);  }
    / r:real16 '-i'                 { return new Complex(r, -1); }
    / '+' i:ureal16 'i'             { return new Complex(0, i);  }
    / '-' i:ureal16 'i'             { return new Complex(0, -i); }
    / r:real16                      { return r;                  }
    / '+i'                          { return new Complex(0, 1);  }
    / '-i'                          { return new Complex(0, -1); }
    

real16
    = s:sign u:ureal16 { return s === '-' ? -u : u; }
    / infinity

ureal16
    = numer:uinteger16 '/' denom:uinteger16 { return numer / denom; }
    / uinteger16

uinteger16
    = ds:digit16+ { return parseInt(ds.join(''), 16); }

prefix16
    = radix16 exactness
    / exactness radix16

infinity
    = '+inf.0'i { return Infinity; }
    / '-inf.0'i { return -Infinity; }
    / '+nan.0'i { return NaN; }

sign
    = [+-]?

exactness
    = '#i'i
    / '#e'i
    / empty

radix2
    = '#b'i
radix8
    = '#o'i
radix10
    = ('#d'i)?
radix16
    = '#x'i

digit2
    = [01]
digit8
    = [01234567]
digit10
    = digit
digit16
    = digit10
    / [abcdef]i

empty = 
