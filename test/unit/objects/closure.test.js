/* global describe, it */

var r7rs    = require('../../..');
var objects = r7rs.objects;
var Closure = objects.Closure;
var Nil     = objects.Nil;


describe('Closure', function () {

  describe('#display()', function () {

    it('should return "#<closure>" when it\'s a simple closure', function () {
      var closure = new Closure({ type: 'halt' }, [], 0, false);
      closure.display().should.eql('#<closure>');
    });

    it('should return "#<continuation>" when it\'s a continuation', function () {
      var closure = new Closure({ type: 'nuate' }, [], 0, false);
      closure.display().should.eql('#<continuation>');
    });
  });
});
