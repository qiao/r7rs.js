var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var del = require('del');
var gulp = require('gulp');
var gutil = require('gulp-util');
var runSequence = require('run-sequence');
var source = require('vinyl-source-stream');
var ts = require('gulp-typescript');
var tslint = require('gulp-tslint');
var mocha = require('gulp-mocha');
var peg = require('gulp-peg');


gulp.task('parser', function() {
  return gulp.src('src/**/*.pegjs')
    .pipe(peg().on('error', gutil.log))
    .pipe(gulp.dest('lib'));
});

gulp.task('lint', function() {
  return gulp.src('src/**/*.ts')
    .pipe(tslint())
    .pipe(tslint.report('verbose', {
      emitError: false
    }));
});

gulp.task('clean:js', function() {
  return del([
    'lib'
  ]);
});

gulp.task('js', ['parser'], function() {
  return gulp.src('src/**/*.ts')
    .pipe(ts({
      module: 'commonjs',
      noImplicitAny: true,
      removeComments: false,
      target: 'ES3',
      typescript: require('typescript')
    }))
    .pipe(gulp.dest('lib'));
});

gulp.task('dist', function() {
  return browserify({
    entries: 'lib/index.js',
    standalone: 'r7rs'
  }).bundle()
    .pipe(source('r7rs.js'))
    .pipe(buffer())
    .pipe(gulp.dest('dist/'));
});

gulp.task('default', function(callback) {
  runSequence(
    'clean:js',
    'js',
    'dist',
    callback);
});

gulp.task('test', ['default'], function() {
  return gulp.src('test/**/*.test.js', { read: false })
    .pipe(mocha({
      bail: false,
      ignoreLeaks: false,
      timeout: 2000,
      reporter: 'spec',
      require: ['should'],
      ui: 'bdd',
    }));
});
