var merge = require('deepmerge');
var os = require('os');
var browserify = require('browserify');
var chalk = require('chalk');
var config = {};
var config_name = 'grunt-config.js'; // don't change this name it should be constant
var config_home_path = os.homedir() + '/config/grunt/project-name/' + config_name; // edit this to be project specific. {project-name} should be a unique name specific to the theme or project. An example for a site that is a multisite with multiple themes with grunt configs
// /config/grunt/my-site/my-theme/grunt-config.js

// define default file paths
var bower_path = 'bower_components/';
var bootstrap_js = bower_path + 'bootstrap-sass-official/assets/javascripts/bootstrap/';
var owl_path_js = bower_path + 'owl-carousel/owl-carousel/';
var respond_path = bower_path + 'respondJS/dest/';
var slick_js = bower_path + 'slick.js/slick/';
var js_files = [1
	// {
	//     name: 'filename',
	//     path: 'path/to/file.js',
	// }
	// { name: 'bootstrap-carousel', path: bootstrap_js + 'carousel.js' },
	// { name: 'bootstrap-dropdown', path: bootstrap_js + 'dropdown.js' },
	// { name: 'owl-carousel', path: owl_path_js + 'owl.carousel.js' },
	// { name: 'respond', path: respond_path + 'respond.src.js' },
	// 
	// example of combining two files
	// This example combines the carousel bootstrap file and the dropdown bootstrap file into one file called combined.js and combined.min.js
	// { name: 'combined', path: [bootstrap_js + 'dropdown.js', bootstrap_js + 'carousel.js'] },

];

var default_options = {
	uglify: {
		main: {
			options: {
				// banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
				mangle: false,
				compress: true,
				beautify: false
			},
			files : {
				'js/script.min.js': 'js/script.js',
			}
		},
		developer: {
			options: {
				// banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
				mangle: false,
				compress: false,
				beautify: true
			},
			files: get_file_paths_objects(js_files, false),
		},
		production: {
			options: {
				mangle: false,
				compress: true,
				beautify: false,
			},
			files: get_file_paths_objects(js_files, true),
		},
	},
	/**
		 * LIBSASS
		 * options for compiling SASS from the LIBSASS compiler
		 * don't have it?
		 * install it with brew
		 *
		 * brew install libsass
		 *
		 * don't have brew?
		 *
		 * install it here: http://brew.sh/
		 */
	sass: {
		development: {
			options: {
				outputStyle: 'expanded',
				sourceMap: true,
			},
			files: {
				'css/main.css': 'sass/main.scss',
			}
		},

		production: {
			options: {
				outputStyle: 'compressed'
			},
			files: {
				'css/main.min.css': 'sass/main.scss',
			}
		},
		editor: {
			options: {
				outputStyle: 'expanded',
				sourceMap: false, // you probably don't need this to be true unless you need to debug stuff
			},
			files: {
				'css/editor-styles.css': 'sass/wp-editor.scss',
			}
		},
	},
	autoprefixer: {
		options: {
		// Task-specific options go here.
			browsers: ['last 4 versions', 'ie 8', 'ie 9'],
		},

		// prefix all files
		developer: {
			options: {
				map: true,
			},
			expand: true,
			flatten: true,
			src: 'css/main.css', // target only the main.css file
			dest: 'css/'
		},
		production: {
			options: {
				map: false,
			},
			expand: true,
			flatten: true,
			src: 'css/main.min.css', 
			dest: 'css/'	
		}
	},
	sprite: {
		all: {
			src: 'img/sprites/*.png',
			dest: 'img/spritesheet.png',
			destCss: 'sass/modules/sprites.scss',
			imgPath: "../img/spritesheet.png"
		}
	},
	watch: {
		sass: {
			files: ['sass/*.scss', "sass/**/*.scss"],
			tasks: ['css_compile']

		},
		js: {
			files: 'js/script.js',
			tasks: ['uglify:main']
		}
	},
	ftp_push: {
		staging: {

		}
	}
}
var command = process.argv[2];

if(module_available('./' + config_name)) {
	var custom_options = require('./' + config_name);
	config = merge(default_options, custom_options); // merge our defaults and custom options

} else if(module_available(config_home_path)) {
	var custom_options = require(config_home_path);
	config = merge(default_options, custom_options); // merge our defaults and custom options from our home directory path
} else {
	if( command == 'watch' ) {
		// only show this message when you call watch
		console.log(chalk.yellow("\n\nNOTICE:\nNo grunt config file found. Just so you know you can create a grunt-config.js file in your project directory or somewhere in your home directory to allow options tailored to your environment only. If you don\'t care about that then ignore this message\n\n\n"));
	}

	config = default_options;

}

module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		uglify: config.uglify,
		sass: config.sass,
		autoprefixer: config.autoprefixer,
		// want to add this awesome FTP push everytime you
		// save your sass files?
		// alter the settings in the options for the
		// FTP Push. You will need to edit these options
		// in the grunt config file.
		ftp_push: config.ftp_push,
		sprite: config.sprite,
		watch: config.watch,
		 
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-sass');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-autoprefixer');
	grunt.loadNpmTasks('grunt-ftp-push');

	grunt.registerTask('css_compile', ['sass:development', 'sass:production', 'autoprefixer']);
	grunt.registerTask('css_editor', ['sass:editor']); // compile the editor styles with "grunt css_editor"

	grunt.loadNpmTasks('grunt-spritesmith');

	grunt.registerTask('compilejs', ['browserify', 'uglify:main']);
	grunt.registerTask('scripts', ['uglify:developer', 'uglify:production']);
};

function get_file_paths_objects(file_paths, min) {
	var js_path = 'js/';
	var js_ext  = '.js';

	if(min == true) {
		// js_path = 'js/min/';
		js_ext  = '.min.js';
	}

	var max = file_paths.length;
	var files_object = {};
	// build the objects
	for(var i=0; i < max; i++) {
		// 'js/min/script.min.js': 'js/script.js',
		files_object[ js_path + file_paths[i].name + js_ext ] = file_paths[i].path;
	}

	return files_object;
}

function module_available(path) {
    try {
        require.resolve(path);
    } catch(e){
    	// no message needed
	    return false;
    }

    return true;
}
// TODO: get a configurable named path within the home directory and return the config file
function get_config_options() {
	
}