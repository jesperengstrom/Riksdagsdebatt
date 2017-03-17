/**
 * Template with Sass, autoprefix, Babel & browserSync.
 * Only need to npm install + gulp
 */


const gulp = require('gulp');
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const browserSync = require('browser-sync').create();
const autoprefixer = require('autoprefixer');
const babel = require('gulp-babel');


gulp.task('default', ['sass', 'babel'], () => {
    browserSync.init({
        server: {
            baseDir: "./"
        }
    });

    gulp.watch("./*.html").on('change', browserSync.reload);
    gulp.watch('./src/scss/**/*.scss', ['sass']);
    gulp.watch('./src/js/*.js', ['babel']);

});

gulp.task('sass', () => {
    return gulp.src('./src/scss/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss([autoprefixer({ browsers: ['last 2 versions'] })]))
        .pipe(gulp.dest('./dist/css'))
        .pipe(browserSync.stream());
});



gulp.task('babel', () => {
    return gulp.src('./src/js/*.js')
        .pipe(babel({
            presets: ['latest']
        }))
        .pipe(gulp.dest('dist/js'));
});