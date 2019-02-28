module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        sass: {
            dev: {
                options: {
                    sourceMap: false,
                    debugInfo: true,
                    trace: true,
                    outputStyle: "compressed"
                },
                files: [{
                    expand: true,
                    cwd: "assets/scss",
                    src: ["**/*.scss"],
                    dest: "assets/css/themes",
                    rename: function (dest, src) {
                        return dest + "/" + src.replace('.scss', '.min.css')
                    }
                }]
            },
            prod: {
                options: {
                    sourceMap: false,
                    debugInfo: true,
                    trace: true,
                    outputStyle: "expanded"
                },
                files: [{
                    expand: true,
                    cwd: "assets/scss",
                    src: ["**/*.scss"],
                    dest: "assets/css/themes",
                    rename: function (dest, src) {
                        return dest + "/" + src.replace('.scss', '.css')
                    }
                }]
            }
        },
        watch: {
            styles: {
                files: ['assets/**/*.scss'],
                tasks: ['sass:dev'],
                options: {
                    spawn: false
                },
            },
            scripts: {
                files: ['assets/js/core.js'],
                tasks: ['uglify'],
                options: {
                    spawn: false
                }
            }
        },
        validation: {
            options: {
                doctype: 'HTML5'
            },
            files: {
                src: ['*.html']
            }
        },
        copy: {
            main: {
                files: [
                    {
                        expand: true, 
                        cwd: 'assets/plugins/node_modules', 
                        src: ['**'], 
                        dest: 'assets/plugins/'
                    }
                ]
            }
        },
        remove: {
            options: {
                trace: false
            },
            main: {
                dirList: ['assets/plugins/node_modules']
            }
        },
        uglify: {
            options: {
                mangle: {
                    except: ['jQuery']
                }
            },
            js: {
                files: {
                    'assets/js/core.min.js':
                    [
                        'assets/js/core.js'
                    ]
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-w3c-html-validation');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-remove');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.registerTask('default', ['watch']);
}