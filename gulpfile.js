var gulp = require('gulp');
var ts = require('gulp-typescript');



gulp.task('default', function() {
  gulp.src('src/**/*.ts')
    .pipe(ts({
      module: 'commonjs',
      noImplicitAny: true,
      removeComments: false,
      target: 'ES3',
    }))
    .pipe(gulp.dest('lib'));
});
