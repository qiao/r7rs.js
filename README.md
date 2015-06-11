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
* Avoid using ES5 array methods such as `forEach`, `map`, `filter`, etc, since they are much slower than the regular for-loops.
However, using ES6 for-of-loops is permitted as they're transpiled by TypeScript to be regular for-loops.

    e.g.

    ```ts
    let xs = [1, 2, 3];
    for (let x of xs) {
      console.log(x);
    }
    ```

    will be transpiled to:

    ```js
    var xs = [1, 2, 3];
    for (var _i = 0; _i < xs.length; _i++) {
      var x = xs[_i];
      console.log(x);
    }
    ```
