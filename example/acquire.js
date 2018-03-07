/**
 * Acquire - Lightweight require() script and file loader with caching
 *
 * @version 0.0.5
 * @author Christian Blanquera <cblanquera@openovate.com>
 * @website https://github.com/cblanquera/acquire
 * @license MIT
 */
(function() {
    /* Definition
    -------------------------------*/
    var acquire = function(path, callback) {
        callback = callback || noop;

        //requirejs style
        if(path instanceof Array) {
            return loadArray(path, function() {
                var args = Array.prototype.slice.apply(arguments);

                //delay the callback to match the
                //order of precached and unloaded
                setTimeout(function() {
                    callback.apply(null, args);
                });
            }, [], true);
        }

        // node style
        return acquire.loadPath(path, callback, true);
    };

    /* Public Properties
    -------------------------------*/
    acquire.cache = {};

    /* Private Properties
    -------------------------------*/
    var noop = function() {};
    var paths = {};

    /* Public Methods
    -------------------------------*/
    /**
     * Configures global paths as in
     * sample => /sample/path so when you
     * acquire('sample/file') means acquire(/sample/path/file)
     *
     * @param object
     * @return this
     */
    acquire.config = function(config) {
        //soft merge
        for(var path in config) {
            if(config.hasOwnProperty(path)) {
                paths[path] = config[path];
            }
        }

        return acquire;
    };

    /**
     * Forces a load even if it's cached
     *
     * @param array|string[,string..]
     * @param callback
     * @return void
     */
    acquire.load = function(paths, callback) {
        callback = callback || noop;

        //if it's a string lets make it into an array
        if(typeof paths === 'string') {
            paths = Array.prototype.slice.apply(arguments);
            //try to get the callback
            if(typeof paths[paths.length - 1] === 'function') {
                callback = paths.pop();
            }
        }

        //if no callback, set one
        if(typeof callback !== 'function') {
            callback = noop;
        }

        //if paths is an array, load it as an array
        //NOTE: nothing should be really returned
        // because it's obviously not cached
        if(paths instanceof Array) {
            return loadArray(paths, function() {
                var args = Array.prototype.slice.apply(arguments);
                setTimeout(function() {
                    callback.apply(null, args);
                });
            });
        }

        //if it's not a string or array, it's an object
        //NOTE: nothing should be really returned
        // because it's obviously not cached
        return loadObject(paths, function() {
            var args = Array.prototype.slice.apply(arguments);
            setTimeout(function() {
                callback.apply(null, args);
            });
        });
    };

    /**
     * Can load a js or any other file, considering
     * cache if the flag is on
     *
     * @param string
     * @param function
     * @param bool
     */
    acquire.loadPath = function(path, callback, cached) {
        //determine the path
        path = acquire.bpm(path);

        //if it's a js file
        if(path.split('.').pop() === 'js') {
            return acquire.loadScript(path, callback, cached);
        }

        return acquire.loadFile(path, callback, cached);
    };

    /**
     * Specifically loads javascript files, considering
     * cache if the flag is on
     *
     * @param string
     * @param function
     * @param bool
     * @return mixed
     */
    acquire.loadScript = function(path, callback, cached) {
        //if we are considering cache and it exists
        if(cached && typeof acquire.cache[path] !== 'undefined') {
            //is it evaluable ?
            if(typeof acquire.cache[path] === 'string'
            && acquire.cache[path].indexOf('eval;') === 0) {
                //yea this just happened.
                eval(decodeURIComponent(acquire.cache[path].substr(5)));

                acquire.cache[path] = module.exports;

                //reset exports
                module.exports = null;
            }

            //return it

            //requirejs style
            setTimeout(function() {
                callback(acquire.cache[path]);
            });

            //node js style
            return acquire.cache[path];
        }

        //otherwise, it's not cached yet
        getScript(path, function() {
            //if no exports
            if(!module.exports) {
                //there's nothing to cache
                callback(acquire.cache[path]);
                return;
            }

            //cache it
            acquire.cache[path] = module.exports;

            //reset exports
            module.exports = null;

            //continue with life.
            callback(acquire.cache[path]);
        });
    };

    /**
     * AJAXes any file in, considering
     * cache if the flag is on
     *
     * @param string
     * @param function
     * @param bool
     * @return mixed
     */
    acquire.loadFile = function(path, callback, cached) {
        //if we are considering cache and it exists
        if(cached && typeof acquire.cache[path] !== 'undefined') {
            //is it evaluable ?
            if(typeof acquire.cache[path] === 'string'
            && acquire.cache[path].indexOf('eval;') === 0) {
                //a fake eval for non js
                acquire.cache[path] = decodeURIComponent(acquire.cache[path].substr(5));
            }

            //return it

            //require js style
            setTimeout(function() {
                callback(acquire.cache[path]);
            });

            //node js style
            return acquire.cache[path];
        }

        //lets ajax.
        getFile(path, function(response) {
            //cache the response
            acquire.cache[path] = response;

            //continue with life
            callback(acquire.cache[path]);
        });
    };

    /**
     * Adds the js extension if no extension exists
     *
     * @param string
     * @return string
     */
    acquire.getPath = function(path) {
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

    /**
     * Bower Package Manager
     * Determines the entire path given
     * the global pathing set in config.
     * WARNING: if using relative paths like template/file
     * this would translate to /bower_components/template/file/index.js
     *
     * @param string
     * @return string
     */
    acquire.bpm = function(path) {
        //if it starts with a / or has a ://
        if(path.indexOf('/') === 0
        || path.indexOf('://') !== -1) {
            //just do the default thing
            return acquire.getPath(path);
        }

        var pathArray = path.split('/');

        //determine the module name
        var module = pathArray.shift();

        //get put together the rest of the path
        path = pathArray.join('/');

        //this is the hard coded path
        var root = '/bower_components';

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

        return acquire.getPath(root + extra + path);
    };

    /* Private Methods
    -------------------------------*/
    /**
     * Soft merges path and value
     * to the global cache variable
     *
     * @param string
     * @return array
     */
    var loadObject = function(paths, callback) {
        var results = [];

        //soft merge
        for(var path in paths) {
            if(paths.hasOwnProperty(path)) {
                acquire.cache[path] = paths[path];
                results.push(acquire.cache[path]);
            }
        }

        callback.apply(null, results);

        return results;
    };

    /**
     * Loads files by the list
     *
     * @param array
     * @param function
     * @param array current results
     * @param bool whether to use cache
     * @return void
     */
    var loadArray = function(paths, callback, results, cached) {
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
            loadArray(paths, callback, results, cached);
            return;
        }

        acquire.loadPath(path, function(result) {
            results.push(result);
            loadArray(paths, callback, results, cached);
        }, cached);
    };

    /**
     * Gets a script remotely, runs it
     * and caches it.
     *
     * @param string
     * @param function
     * @return void
     */
    var getScript = function(source, callback) {
        callback = callback || noop;

        var script     = document.createElement('script');
        var head     = document.getElementsByTagName('head')[0];

        script.async = 1;

        head.appendChild(script);

        script.onload = script.onreadystatechange = function( _, isAbort ) {
            if(isAbort || !script.readyState || /loaded|complete/.test(script.readyState) ) {
                script.onload = script.onreadystatechange = null;
                script = undefined;

                if(!isAbort) {
                    callback();
                }
            }
        };

        script.src = source;
    };

    /**
     * Gets a file remotely
     * and caches it.
     *
     * @param string
     * @param function success callback
     * @param function fail callback
     * @return void
     */
    var getFile = function(url, success, fail) {
        success = success || noop;
        fail     = fail || noop;

        var xhr;

        if(typeof XMLHttpRequest !== 'undefined') {
            xhr = new XMLHttpRequest();
        } else {
            var versions = [
                'MSXML2.XmlHttp.5.0',
                'MSXML2.XmlHttp.4.0',
                'MSXML2.XmlHttp.3.0',
                'MSXML2.XmlHttp.2.0',
                'Microsoft.XmlHttp'];

             for(var i = 0; i < versions.length; i++) {
                try {
                    xhr = new ActiveXObject(versions[i]);
                    break;
                }
                catch(e){}
             }
        }

        if(!xhr) {
            fail(null);
            return;
        }

        var process = function() {
            if(xhr.readyState < 4) {
                return;
            }

            if(xhr.status >= 404 && xhr.status < 600) {
                fail(xhr);
                return;
            }

            if(xhr.status !== 200) {
                return;
            }

            // all is well
            if(xhr.readyState === 4) {
                var response = xhr.responseText;

                try {
                    response = JSON.parse(response);
                } catch(e) {}

                success(response, xhr);
            }
        };

        xhr.onreadystatechange = process;
        xhr.open('GET', url, true);
        xhr.send('');
    };

    /* Adaptor
    -------------------------------*/
    //make a module object
    if(typeof window.module === 'undefined') {
        window.module = { exports: null };
    }

    //Set global variables
    window.acquire = acquire;

    //no requirejs ? You made the right decision :)
    if(typeof window.require === 'undefined') {
        window.require = acquire;
    }

    if(typeof jQuery !== 'undefined' && typeof jQuery.require === 'undefined') {
        jQuery.extend({ require: acquire });
    }
})();
