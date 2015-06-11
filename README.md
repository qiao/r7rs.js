R7RS.js
=======

[![Build Status](https://travis-ci.org/qiao/r7rs.js.svg?branch=master)](https://travis-ci.org/qiao/r7rs.js)

R7RS ("small" language) compliant Scheme implementation in JavaScript. (Work in progress)


References
----------

* [Ninth draft of the R7RS ("small" language)](http://trac.sacrideo.us/wg/raw-attachment/wiki/WikiStart/r7rs-draft-9.pdf)
* [Three Implementation Models for Scheme](http://www.cs.indiana.edu/~dyb/papers/3imp.pdf)
* [SISC](http://sisc-scheme.org/)
* [Biwascheme](https://github.com/yhara/biwascheme)
* [Guile](www.gnu.org/software/guile)


Coding Convention
-----------------

* Use `const` whenever possible.
* Prefer `let` over `var` as `let` has narrower scope.
