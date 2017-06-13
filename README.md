# Injular

[![npm version](http://img.shields.io/npm/v/bs-injular.svg)](https://npmjs.org/package/bs-injular)
[![build status](https://img.shields.io/travis/tfoxy/bs-injular.svg)](https://travis-ci.org/tfoxy/bs-injular)
[![codecov](https://codecov.io/gh/tfoxy/bs-injular/branch/master/graph/badge.svg)](https://codecov.io/gh/tfoxy/bs-injular)
[![Gitter](https://badges.gitter.im/tfoxy/bs-injular.svg)](https://gitter.im/tfoxy/bs-injular?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

> Inject angular templates, controllers, directives and components with Browsersync

AngularJS 1.x hot reloading.
This is a plugin for the awesome [BrowserSync](https://browsersync.io).


## Install

```shell
$ npm install --save-dev bs-injular injular@legacy browser-sync
```


## Try it

You can try a **[live demo of the client code by clicking here](https://tfoxy.github.io/bs-injular-live-demo/#/gh-gist/83f19f04eacc289cd0fc7afedd66559f)**.

If you want to try it with the server code, run the following commands:

```shell
git clone https://github.com/tfoxy/bs-injular-demo.git
cd bs-injular-demo
npm install && bower install
gulp serve
```

Modify the `*.html`, `*.controller.js` and `*.directive.js` files inside `src/app`
and watch the changes instantly.

**[Click here to watch GIF of demo](https://raw.githubusercontent.com/tfoxy/bs-injular-demo/master/bs-injular.gif)**


## Setup

### Minimal

```js
var browserSync = require('browser-sync');
var bsInjular = require('bs-injular');

browserSync.use(bsInjular, {
  templates: '**/app/**/*.html',
});

browserSync({
  /* browserSync options */
});
```

This will inject all html files inside an `app` folder.

### Recommended

```js
var browserSync = require('browser-sync');
var bsInjular = require('bs-injular');

browserSync.use(bsInjular, {
  templates: '**/app/**/*.html',
  controllers: '**/app/**/*.controller.js',
  directives: '**/app/**/*.+(directive|component).js',
  filters: '**/app/**/*.filter.js',
  angularFile: '/bower_components/angular/angular.js',
  moduleFile: '**/app/index.module.js'
});

browserSync({
  /* browserSync options */
});
```

This supports template, controller, directive, component and filter injection.


## Configuration

If you want to inject controllers, you must provide the following properties:

```js
{
  controllers: '**/app/**/*.controller.js',
  moduleFile: '**/app/index.module.js'
}
```

The module file is necessary to get the `$controllerProvider`
in the config phase so that the controllers can be injected later.

If you want to inject directives and components, you must provide the following properties:

```js
{
  directives: '**/app/**/*.+(directive|component).js',
  angularFile: '/bower_components/angular/angular.js',
  moduleFile: '**/app/index.module.js'
}
```

The module file is necessary to get the `$compileProvider`
in the config phase so that the directives can be injected later.  
The angular file is necessary to keep track of the directives present in a file.

**WARNING:** The controller files must retrieve the module using `angular.module()`
and only use the `controller` recipe. The same applies to directives.

```js
angular
  .module('myProject')
  .controller('Controller', Controller);

function Controller() {
  // Controller code here
}
```

If there is any other angular recipe, it will be ignored.


Also, when using the BrowserSync API, you must only reload the changed script file:
```js
browserSync.reload('app/main/main.controller.js')
```
When `browserSync.stream` is used with multiple source files, it will reload the page.  
If you use 
[generator-gulp-angular](https://github.com/Swiip/generator-gulp-angular),
you must change the watches behaviour so that only the changed script is reloaded.  
See:
[scripts.js](https://github.com/tfoxy/bs-injular-demo/blob/master/gulp/scripts.js#L13-L18)
[watch.js](https://github.com/tfoxy/bs-injular-demo/blob/master/gulp/watch.js#L26-L32)


## Version support

Supports AngularJS from 1.2 to 1.5 .
Supports all modern browsers and IE >= 8.
NOTE: for IE8, you must set supportIE8 option to true:

```js
browserSync.use(bsInjular, {
  supportIE8: true,
  /* bs-injular options */
});
```


## Help

If you have some problems with the configuration,
you can get more information by setting the log level of Browsersync to `debug`:

```js
browserSync({
  logLevel: 'debug',
  /* browserSync options */
});
```

If you get the following messages when changing a file:
```sh
[BS] [Injular] No moduleFile was matched: **/app/index.module.js
[BS] [Injular] No angularFile was matched: /bower_components/angular/angular.js
```
you can check if those patterns match any of the requests made to the server.

If you need more help, you can submit an issue
or leave a message in [gitter](https://gitter.im/tfoxy/bs-injular).


## What's missing

* Support for javascript bundlers: webpack, browserify, rollup<i></i>.js  
  Template injection works. Scripts changes reload the browser.

* Injection of `service` and `factory` recipes.

* Show the file and line number when an error is thrown in an injected script.  
  Currently, the script is evaluated using `Function`.


## Resources

* [BrowserSync](https://github.com/shakyShane/browser-sync)
* [BrowserSync SPA](https://github.com/shakyShane/browser-sync-spa)

Inspired by
[shakyShane/html-injector](https://github.com/shakyShane/html-injector)
and
[pashaigood/browser-sync-angular-template](https://github.com/pashaigood/browser-sync-angular-template)
