/**
 * Acquire - Lightweight require() script and file loader with caching
 *
 * @version 0.0.1
 * @author Christian Blanquera <cblanquera@openovate.com>
 * @website https://github.com/cblanquera/acquire
 * @license MIT
 */
(function() {
	/* Definition
	-------------------------------*/
	var definition = function(path, callback) {
		callback = callback || noop;
		
		path = definition.getPath(path);
		
		if(typeof definition.cache[path] !== 'undefined') {
			callback(definition.cache[path]);
			return definition.cache[path];	
		}
		
		definition.loadPath(path, function() {
			callback(definition.cache[path]);
		});
	};
	
	/* Public Properties
	-------------------------------*/
	definition.cache = {};
	
	/* Private Properties
	-------------------------------*/
	var noop = function() {};
	
	/* Public Methods
	-------------------------------*/
	definition.load = function(paths, callback) {
		callback = callback || noop;
		
		if(typeof paths === 'string') {
			paths = Array.prototype.slice.apply(arguments);
			if(typeof paths[paths.length - 1] === 'function') {
				callback = paths.pop();
			}
		}
		
		if(typeof callback !== 'function') {
			callback = noop;
		}
		
		if(paths instanceof Array) {
			loadArray(paths, callback);
			return this;
		}
		
		loadObject(paths, callback);
		return this;
	};
	
	definition.loadPath = function(path, callback) {
		path = definition.getPath(path);
		
		switch(path.split('.').pop()) {
			case 'js':
				definition.loadScript(path, callback);
				break;
			default:
				definition.loadFile(path, callback);
				break;
		}
	};
	
	definition.loadScript = function(path, callback) {
		jQuery.getScript(path).done(function() {
			if(!module.exports) {
				callback(definition.cache[path]);
				return;
			}
			
			definition.cache[path] = module.exports;
			callback(definition.cache[path]);
		});
	};
	
	definition.loadFile = function(path, callback) {
		//lets ajax.
		jQuery.get(path, function(response) {
			definition.cache[path] = response;
			callback(definition.cache[path]);
		});
	};
	
	definition.getPath = function(path) {
		//get the extension
		var extension = path.split('.').pop();
		
		//if no extension
		if(!extension 
		|| !extension.length
		|| extension === path) {
			//append the extension
			path += '.js';
		}
		
		return path;
	};
	
	/* Private Methods
	-------------------------------*/
	var loadObject = function(paths, callback) {
		//soft merge
		for(var path in paths) {
			if(paths.hasOwnProperty(path)) {
				definition.cache[path] = paths[path];
			}
		}
		
		callback(null);
	};
	
	var loadArray = function(paths, callback) {
		if(!paths.length) {
			callback(null);
			return;
		}
		
		var path = paths.shift();
		
		if(typeof path !== 'string') {
			loadArray(paths, callback);
		}
		
		definition.loadPath(path, function() {
			loadArray(paths, callback);
		});
	};
	
	/* Adaptor
	-------------------------------*/
	if(!window.module) {
		window.module = { exports: null };
	}
	
	if(typeof window.require !== 'undefined' 
	&& typeof jQuery.require !== 'undefined') {
		window.acquire = definition;
	}
	
	if(typeof window.require === 'undefined') {
		window.require = definition;
	}
	
	if(typeof jQuery.require === 'undefined') {
		jQuery.extend({ require: definition });
	}
})();