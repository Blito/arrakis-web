// get access to the gulp API
var gulp = require('gulp');
var print = require('gulp-print');
var babel = require('gulp-babel');
var webserver = require('gulp-webserver');

gulp.task('js', function() {
  return gulp.src('app/**/*.js')               // #1. select all js files in the app folder
        .pipe(print())                           // #2. print each file in the stream
      .pipe(babel({ presets: ['es2015'] }))    // #3. transpile ES2015 to ES5 using ES2015 preset
      .pipe(gulp.dest('build'));               // #4. copy the results to the build folder
});


gulp.task('watch', function(){
    gulp.watch('app/**/*.*', ['build']);
});

gulp.task('libs', function(){
    return gulp.src([
        'node_modules/systemjs/dist/system.js',
        'node_modules/babel-polyfill/dist/polyfill.js'])
        .pipe(print())
        .pipe(gulp.dest('build/libs'));
});

gulp.task('build', ['js', 'libs'], function(){
    return gulp.src(['app/**/*.html', 'app/**/*.css'])
            .pipe(print())
            .pipe(gulp.dest('build'));
});

gulp.task('serve', ['build'], function() {
    gulp.src('build')
        .pipe(webserver({open: true}));
});

gulp.task('default', ['build']);
