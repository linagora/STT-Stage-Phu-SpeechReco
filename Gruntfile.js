'use strict';

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: ';'
      }
    },
    jshint: {
      files: ['Gruntfile.js', 'backend/**/*.js', 'frontend/js/**/*.js'],
      options: {
        jshintrc: '.jshintrc'
      }
    },
    nodemon: {
      dev: {
        script: 'app.js',
        options: {
          env: {NODE_ENV: 'dev'},
          ignore: ['.git', 'README.md', 'node_modules/**', 'backend/lib/kaldi-trunk/*'],
          watchedExtensions: ['js', 'jade'],
          callback: function (nodemon) {
            nodemon.on('log', function (event) {
              console.log(event.colour);
            });

            nodemon.on('config:update', function () {
              // Delay before server listens on port
              setTimeout(function() {
                require('open')('http://localhost:8080');
              }, 2000);
            });
          }
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-nodemon');

  grunt.registerTask('gjslint', 'run the closure linter', function() {
    var done = this.async();

    var child = require('child_process').spawn('python', [
      './scripts/gjslint.py',
      '--disable',
      '0110',
      '--nojsdoc',
      '-r',
      'test',
      '-r',
      'backend',
      '-r',
      'frontend/js'
    ]);

    child.stdout.on('data', function(chunk) { grunt.log.write(chunk); });
    child.stderr.on('data', function(chunk) { grunt.log.error(chunk); });
    child.on('close',function(code) { done(code ? false : true); });
  });

  grunt.registerTask('default', ['jshint', 'gjslint']);
  grunt.registerTask('linters', ['jshint', 'gjslint']);
  grunt.registerTask('dev', ['nodemon:dev']);
};
