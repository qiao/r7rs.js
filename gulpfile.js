var gulp = require('gulp');
var gutil = require('gulp-util');
var peg = require('gulp-peg');
var ts = require('gulp-typescript');


gulp.task('parser', function() {
  gulp.src('src/**/*.pegjs')
    .pipe(peg().on('error', gutil.log))
    .pipe(gulp.dest('lib'));
});


gulp.task('default', ['parser'], function() {
  gulp.src('src/**/*.ts')
    .pipe(ts({
      module: 'commonjs',
      noImplicitAny: true,
      removeComments: false,
      target: 'ES3',
      typescript: require('typescript')
    }))
    .pipe(gulp.dest('lib'));
});
