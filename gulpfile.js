const gulp = require('gulp');
const coffee = require('gulp-coffee');


gulp.task('compile coffeescript', function () {
    //Coffeescript
    gulp.src(["src/**/*.coffee"])
        .pipe(coffee())
        .pipe(gulp.dest("dist"));
});