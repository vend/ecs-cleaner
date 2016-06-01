'use strict'; // eslint-disable-line strict

const babel = require('gulp-babel');
const del = require('del');
const debug = require('gulp-debug');
const eslint = require('gulp-eslint');
const fs = require('fs');
const gulp = require('gulp');
const path = require('path');
const Promise = require('bluebird');
const sequence = require('gulp-sequence');
const sourcemaps = require('gulp-sourcemaps');
const gutil = require('gulp-util');
const _ = require('lodash');

Promise.promisifyAll(fs);

const PATHS = {
  js: {
    src: [
      'src/**/*.js',
    ],
    dest: 'dist',
  },
  build: {
    dest: 'build',
  },
};

/*
 * Helpers
 */
function mkdirp(dir) {
  return fs.statAsync(dir)
    .then(stat => (stat.isDirectory ? Promise.resolve() : Promise.reject(Error('Could not mkdirp: path already exists'))))
    .catch(_err => fs.mkdirAsync(dir))
    .catch(err => {
      if (err.errno !== -17) throw err;
      /* already created */
    });
}

gulp.task('default', sequence('clean', 'createBuildDir', 'build', 'lint'));

gulp.task('clean', () => del(PATHS.build.dest));
gulp.task('createBuildDir', () => mkdirp(PATHS.build.dest));

gulp.task('build', () => gulp.src(PATHS.js.src)
    .pipe(debug({ title: 'build' }))
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(sourcemaps.write('.'))
    .on('error', gutil.log.bind(gutil, 'Browserify error'))
    .pipe(gulp.dest(PATHS.js.dest))
);

gulp.task('lint', () => gulp.src(PATHS.js.src)
  .pipe(eslint())
  .pipe(eslint.format())
);

gulp.task('watch', ['build'], () => {
  gulp.watch(PATHS.js.src, ['build', 'lint']);
});
