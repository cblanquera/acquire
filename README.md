Acquire
=====

Lightweight AMD require() script and file loader with caching

#### Usage

```
require('/application/bar.js');
```

###### Pre-Loader

Set up a preloader so you can use it like require in Node JS.

```
require.load(
	'/application/bar.js',
	'/application/template.html',
	'/application/circle2.js',  
	'/application/circle1.js');
```

You can also directly define the paths as in:

```
require.load({
	'/application/bar.js': function() {
		return 'foo';
	},
	'/application/template.html': '<h1>Yay</h1>',
	'/application/circle2.js': function() {
		console.log('circle-2');
	},  
	'/application/circle1.js': 'eval;require('%2Fapplication%2Fcircle2.js')()%3Bmodule.exports%20%3D%20function()%20%7B%09console.log('circle-1')%3B%7D'});
```

This is the recommended way when you are ready to bundle and minify your code for production use. As you can see `/application/circle1.js` is compiled different than the others. This is because there is some other code outside of the `module.exports`. If you have this same case wrap your entire file using `encodeURIComponent`. Acquire will evaluate strings that start with `eval;` following the encoded code.

If you need to wait for the pre loaders you can include a callback at the end of the load method as in:

```
require.load(
	'/application/bar.js',
	'/application/template.html',
	'/application/circle2.js',  
	'/application/circle1.js',
	function(bar, template, circle2, circle1) {
		require('/test.js');
	});
```

###### Path Configuration

```
require.config({
	application: {
		root: '/application',
		index: 'foobar'
	},
	foobar: '/foobar'
});

require('application/bar'); // will now be the same as require('/application/bar.js')
require('application/bar/'); // will now be the same as require('/application/bar/foobar.js')
require('foobar/bar'); // will now be the same as require('/foobar/bar.js')
require('foobar/bar/'); // will now be the same as require('/foobar/bar/index.js')
```

`Warning: Relative paths like require('application/bar') with no config will default to require('/bower_components/application/bar.js')`

#### No Conflict

`acquire('application/bar')`

Acquire will check to make sure require isn't already used before using that namespace.

#### Why not X ?

 * Wanted a combination of Node style (AMD) requiring with optional async callback
 * Wanted a preloader, but didn't want preloading to be a requirement 
 * Wanted to auto parse JSON Data
 * Wanted something that would not conflict with other require methods (ie. Cordova)
 * Wanted the ability to control the initial cache if integrating to watchers and optimizers
 * Wanted the ability to overwrite core methods
 * Wanted a simple readable implementation
 
#### Works With

 * jQuery
 * Angular - for external modules
 * PhoneGap - using with cordova
 * Gulp - When combining and uglifying
 * Grunt - When combining and uglifying
 * Bower