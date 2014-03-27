module.exports = function(grunt) {
 
  grunt.registerTask('watch', [ 'watch' ]);
  grunt.registerTask('concat' , [ 'concat' ]);
  grunt.registerTask('default',[ 'concat' , 'uglify' ]);
 
  grunt.initConfig({
    concat: {
      js: {
        options: {
          separator: '\n;\n'
        },
        src: [
          'src/_intro.js' ,
          'src/Preloader.js' ,
          'src/OrientationDevice.js' ,
          'src/Viewport.js' ,
          'src/FauxPanorama.js' ,
          'src/_outro.js'
        ],
        dest: 'build/FauxPanorama.js'
      },
    },
    uglify: {
      options: {
        mangle: false
      },
      js: {
        files: {
          'build/FauxPanorama.min.js': ['build/FauxPanorama.min.js']
        }
      }
    },
    watch: {
      js: {
        files: ['src/*.js'],
        tasks: ['concat:js', 'uglify:js'],
      },
    }
  });
 
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
 
};
