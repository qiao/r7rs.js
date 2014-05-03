/*global describe:true, it: true*/

var r7rs    = require('../../..'),
    objects = r7rs.objects,
    Closure = objects.Closure,
    Nil     = objects.Nil;


describe('Closure', function () {

    var closure;

    describe('#display()', function () {

        it('should return "#<closure>" when it\'s a simple closure', function () {
            closure = new Closure({ type: 'halt' }, [], 0, false);
            closure.display().should.eql('#<closure>');
        });

        it('should return "#<continuation>" when it\'s a continuation', function () {
            closure = new Closure({ type: 'nuate' }, [], 0, false);
            closure.display().should.eql('#<continuation>');
        });
    });
});
