/*global describe:true, it: true*/

var r7rs    = require('../../..'),
    objects = r7rs.objects,
    Closure = objects.Closure,
    Nil     = objects.Nil;


describe('Closure', function () {

    var closure;

    describe('#display()', function () {
        closure = new Closure({ type: 'halt' }, [], 0, false);
        closure.display().should.eql('#<closure>');
    });
});
