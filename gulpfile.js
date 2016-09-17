"use strict";

var SRC_PATH = 'src/';
var BUILD_PATH = 'build/';

var gulp = require('gulp');
var gjshint = require('gulp-jshint');
var guglify = require('gulp-uglify');
var greplace = require('gulp-replace');
var grename = require('gulp-rename');
var gstripComments = require('gulp-strip-comments');

gulp.task('default', function() {
  return gulp.src(SRC_PATH + '*.js')
    .pipe(gjshint('.jshintrc'))
    .pipe(gjshint.reporter('default'))
    .pipe(greplace(/console.(log|debug|info|error|warn)( ?| +)\([^;]*\);/g, ''))
    .pipe(gstripComments())
    .pipe(guglify())
    .pipe(grename({ suffix: '.min' }))
    .pipe(gulp.dest(BUILD_PATH));
});
