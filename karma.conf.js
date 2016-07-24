// Karma configuration
// Generated on Wed Apr 13 2016 23:13:43 GMT-0300 (ART)
'use strict';

module.exports = function(config) {
  const ANGULAR_VERSION = process.env.ANGULAR_VERSION || '1.5';

  let props = {
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: [
      'mocha',
      'chai-sinon'
    ],


    // list of files / patterns to load in the browser
    files: [
      require.resolve('chai-string'),
      `bower_components/angular-${ANGULAR_VERSION}/angular.js`,
      require.resolve('jquery'),
      'test-client/bs.js',
      'client/injular.js',
      'client/**/*.js',
      'test-client/**/*.js'
    ],


    // list of files to exclude
    exclude: [
    ],


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  };

  if (process.env.DEBUG) {
    Object.assign(props, {
      browsers: ['PhantomJS_debug'],

      customLaunchers: {
        'PhantomJS_debug': {
          base: 'PhantomJS',
          debug: true
        }
      }
    });
  } else if (process.env.COVERAGE) {
    Object.assign(props, {
      // preprocess matching files before serving them to the browser
      // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
      preprocessors: {
        'client/**/*.js': ['coverage']
      },

      coverageReporter: {
        dir : 'coverage-client/',
        reporters : [
          {type: 'json'},
          {type: 'text-summary'}
        ]
      }
    });
    props.reporters.push('coverage');
  }
  if (process.env.NO_BROWSERS) {
    props.browsers = [];
  }

  config.set(props);
};
