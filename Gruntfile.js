module.exports = function(grunt) {
  "use strict";

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jasmine: {
      jqueryfutures: {
        src: "src/**/*.js",
        options: {
          specs: "spec/**/*_spec.js",
          vendor: [
            "vendor/*.js",
            ],
          version: '2.0.0'
        }
      }
    }
  })

  grunt.loadNpmTasks('grunt-contrib-jasmine')

  grunt.registerTask('test', ['jasmine'])
  grunt.registerTask('default', ['test'])
};