# Injular

[![npm version](http://img.shields.io/npm/v/bs-injular.svg)](https://npmjs.org/package/bs-injular)
[![build status](https://img.shields.io/travis/tfoxy/bs-injular.svg)](https://travis-ci.org/tfoxy/bs-injular)

> Inject angular templates and controllers without reloading the page

This is a plugin for the awesome [BrowserSync](https://browsersync.io).


## Install

```shell
$ npm install --save-dev bs-injular browser-sync
```


## Try it

```shell
git clone https://github.com/tfoxy/bs-injular-demo.git
cd bs-injular-demo
npm install && bower install
gulp serve
```

Modify the `*.html` and `*.controller.js` files inside `src/app`
and watch the changes instantly.

**[Click here to watch GIF of demo](https://raw.githubusercontent.com/tfoxy/bs-injular-demo/master/bs-injular.gif)**


## Setup

### Minimal

```js
var browserSync = require('browser-sync');
var bsInjular = require('bs-injular');

browserSync.use(bsInjular);

browserSync({
  /* browserSync options */
});
```

This will inject all html files inside an app folder.

### Recommended

```js
var browserSync = require('browser-sync');
var bsInjular = require('bs-injular');

browserSync.use(bsInjular, {
  templates: '**/app/**/*.html',
  controllers: '**/app/**/*.controller.js',
  moduleFile: '**/app/index.module.js',
  moduleName: 'fooApp'
});

browserSync({
  /* browserSync options */
});
```

This supports template and controller injection.


## Configuration

By default, the following options are provided:

```js
{
  templates: '**/app/**/*.html',
  notify: true
}
```

If you want to inject controllers, you must provide the following properties:

```js
{
  controllers: '**/app/**/*.controller.js',
  moduleFile: '**/app/index.module.js',
  moduleName: 'fooApp'
}
```

The module file and module name are necessary in order to get the `$controllerProvider`
in the config phase and inject the controllers later.

**WARNING:** The controller files must retrieve the module using `angular.module()`
and only use the `controller` recipe.

```js
angular
  .module('myProject')
  .controller('Controller', Controller);

function Controller() {
  // Controller code here
}
```

If there is a directive, a config block or any other angular recipe, it may work unexpectedly.


Also, when using the BrowserSync API, you must only reload the controller file when there is a change.
If multiple js files are reloaded and one of them is not a controller, it will reload the page.  
If you use 
[generator-gulp-angular](https://github.com/Swiip/generator-gulp-angular),
you must change the watches behaviour so that only the controller is reloaded.  
See:
[scripts.js](https://github.com/tfoxy/bs-injular-demo/blob/master/gulp/scripts.js#L13-L18)
[watch.js](https://github.com/tfoxy/bs-injular-demo/blob/master/gulp/watch.js#L26-L32)


## What's missing

* Support for javascript bundlers: webpack, browserify, rollup<i></i>.js

* Support for inline templates and controllers

* Show the file and line number when an error is thrown in an injected controller.  
  Currently, the controller is evaluated using `Function`.


## Resources

* [BrowserSync](https://github.com/shakyShane/browser-sync)
* [BrowserSync SPA](https://github.com/shakyShane/browser-sync-spa)

Inspired by
[shakyShane/html-injector](https://github.com/shakyShane/html-injector)
and
[pashaigood/browser-sync-angular-template](https://github.com/pashaigood/browser-sync-angular-template)
