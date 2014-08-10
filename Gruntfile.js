module.exports = function(grunt) {
  "use strict";

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    coffee: {
      compile: {
        files: {
          'src/futures.js': 'src/futures.coffee'
        },
        options: {
          sourceMaps: true
        }
      }
    },
    jasmine: {
      src: "src/**/*.js",
      options: {
        specs: "spec/**/*_spec.js",
        helpers: "spec/**/helpers/*.js",
        vendor: [
          "vendor/*.js",
          ],
        version: '2.0.0'
      }
    }
  })

  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-jasmine')

  grunt.registerTask('test', ['jasmine'])
  grunt.registerTask('default', ['coffee', 'test'])
};