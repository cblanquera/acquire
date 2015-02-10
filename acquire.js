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

        // get platform specific path
        path = getPlatformPathPrefix(path);
        
        //from requirejs
        if(path instanceof Array) {
            return loadArray(path, function() {
                var args = Array.prototype.slice.apply(arguments);
                setTimeout(function() {
                    callback.apply(null, args);
                });
            });
        }
        
        path = definition.bpm(path);
        
        if(typeof definition.cache[path] !== 'undefined') {
            setTimeout(function() {
                callback(definition.cache[path]);
            });
            
            return definition.cache[path];  
        }
        
        definition.loadPath(path, function() {
            setTimeout(function() {
                callback(definition.cache[path]);
            });
        });
    };
    
    /* Public Properties
    -------------------------------*/
    definition.cache = {};
    
    /* Private Properties
    -------------------------------*/
    var noop = function() {};
    var paths = {};
    
    /* Public Methods
    -------------------------------*/
    definition.config = function(config) {
        //soft merge
        for(var path in config) {
            if(config.hasOwnProperty(path)) {
                paths[path] = config[path];
            }
        }
        
        return definition;
    };
    
    definition.load = function(paths, callback) {
        callback = callback || noop;

        paths = getPlatformPathPrefix(paths);
        
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
            return loadArray(paths, callback);
        }
        
        return loadObject(paths, callback);
    };
    
    definition.loadPath = function(path, callback) {
        path = definition.bpm(path);
        
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
            
            module.exports = null;
            
            callback(definition.cache[path]);
        }).fail(function(e) {
            throw 'Failed to load ' + path + '. This could be because of a JavaScript error.';
        });
    };
    
    definition.loadFile = function(path, callback) {
        //lets ajax.
        jQuery.get(path, function(response) {
            // let's try if the file is parsable
            try {
                definition.cache[path] = JSON.parse(response);
            } catch(e) {
                // surpress error then continue
                definition.cache[path] = response;
            }

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
    
    definition.bpm = function(path) {
        //if it starts with a / or has a ://
        if(path.indexOf('/') === 0
        || path.indexOf('://') !== -1) {
            //just do the default thing
            return definition.getPath(path);
        }
        
        var pathArray = path.split('/');
        
        //determine the module name
        var module = pathArray.shift();
        
        //get put together the rest of the path
        path = pathArray.join('/');
        
        //this is the hard coded path
        var root = '/browser_modules';
        
        //this is the hard coded index
        var index = '/index.js';
        
        var extra = '/' + module;
        
        if(typeof paths[module] === 'object') {
            if(typeof paths[module].root === 'string') {
                root = paths[module].root;
            }
            
            if(typeof paths[module].index === 'string') {
                index = paths[module].index;
            }
            
            extra = '';
        }
        
        if(!path.length || path === '/') {
            path = index;
        }
        
        if(path.indexOf('/') !== 0) {
            path = '/' + path;
        }
        
        return definition.getPath(root + extra + path);
    };
    
    /* Private Methods
    -------------------------------*/
    var loadObject = function(paths, callback) {
        var results = [];
        
        //soft merge
        for(var path in paths) {
            if(paths.hasOwnProperty(path)) {
                definition.cache[path] = paths[path];
                results.push(definition.cache[path]);
            }
        }
        
        callback.apply(null, results);
        
        return results;
    };
    
    var loadArray = function(paths, callback, results) {
        results = results || [];
        
        if(!paths.length) {
            callback.apply(null, results);
            return results;
        }
        
        var path = paths.shift();
        
        //what do we do if it's not a string ?
        if(typeof path !== 'string') {
            results.push(null);
            //um skip it?
            loadArray(paths, callback, results);
        }
        
        definition.loadPath(path, function(result) {
            results.push(result);
            loadArray(paths, callback, results);
        });
    };
    
    var getPlatformPathPrefix = function(path) {
		//check if using http, then return the path
		if(window.location.protocol == 'http:'
		|| window.location.protocol == 'https:') {
			return path;
		}
		
        // flag if we're running under cordova
        var cordovaNative = window._cordovaNative;
        
        // list of path prefixes
        var pathPrefixes  = {
            'android'       : '/android_asset/www',
            'ios'           : '',
            'blackberry'    : '',
            'windows'       : ''
        };
        
        // get information under userAgent
        var ua = navigator.userAgent;

        // if running under cordova
        if(cordovaNative) {
            // if android
            if(/Android/i.test(ua)) {
                return (path instanceof Array && path.indexOf(pathPrefixes.android) === -1) ? 
                processPathListPrefix(path, pathPrefixes.android) : pathPrefixes.android + path;
            }

            return;
        }

        return path;
    };

    var processPathListPrefix = function(paths, prefix) {
        if(toString.call(paths) === '[object Array]' ||
           toString.call(paths) === '[ojbect Object]') {
            // iterate
            for(var i in paths) {
                paths[i] = (paths[i].indexOf(prefix) === -1) ?
                prefix + paths[i] : paths[i];
            }

            return paths;
        }
    }

    /* Adaptor
    -------------------------------*/
    if(!window.module) {
        window.module = { exports: null };
    }
    
    window.acquire = definition;
    
    if(typeof window.require === 'undefined') {
        window.require = definition;
    }
    
    if(typeof jQuery.require === 'undefined') {
        jQuery.extend({ require: definition });
    }
})();