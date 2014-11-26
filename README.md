Acquire
=====

Lightweight require() script and file loader with caching

#### Usage

###### Loader

```
require.load([
	'/application/bar.js',
	'/application/template.html',
	'/application/circle2.js',  
	'/application/circle1.js'],
	function() {
		require('/test.js');
	});
```

###### circle1.js

```
require('/application/circle2.js')();

module.exports = function() {
	console.log('circle-1');
}
```

#### Why not X ?

 * Wanted a combination of Node style requiring with optional async callback
 * Wanted a preloader, but didn't want preloading to be a requirement 
 * Wanted to auto parse JSON Data
 * Wanted something that would not conflict with other require methods (ie. Cordova)
 * Wanted the ability to control the initial cache if integrating to watchers and optimizers
 * Wanted the ability to overwrite core methods
 * Wanted a simple readable implementation

#### Requires

- jQuery - http://jquery.com/download/