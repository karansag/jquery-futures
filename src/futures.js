
/*
jquery-futures v.0.0.1
 */

(function() {
  var methodize, methods,
    __slice = [].slice;

  window.future = window.future || {};

  future.map = function(prom, fn) {
    var d;
    d = $.Deferred();
    prom.then(function() {
      var results;
      results = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return d.resolve(fn.apply(null, results));
    }, function() {
      var results;
      results = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return d.reject(fn.apply(null, results));
    });
    return Future(d.promise());
  };

  future.flatMap = function(promise, fn) {
    var deferred, reject;
    deferred = $.Deferred();
    reject = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return deferred.reject.apply(deferred, args);
    };

    /* Note: reject the new deferred if either the inner or outer promise fail */
    promise.then(function() {
      var results, secondPromise;
      results = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      secondPromise = fn.apply(null, results);
      return secondPromise.then(function() {
        var otherResults;
        otherResults = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return deferred.resolve.apply(deferred, otherResults);
      }, reject);
    }, reject);
    return Future(deferred.promise());
  };

  future.select = function(promiseArray) {
    var d, promise, resolve, _i, _len;
    d = $.Deferred();
    resolve = function(promise, promiseResult) {
      var otherPromises, p;
      otherPromises = ((function() {
        var _i, _len, _results;
        if (p !== promise) {
          _results = [];
          for (_i = 0, _len = promiseArray.length; _i < _len; _i++) {
            p = promiseArray[_i];
            _results.push(p);
          }
          return _results;
        }
      })());
      return d.resolve(promiseResult, otherPromises);
    };
    for (_i = 0, _len = promiseArray.length; _i < _len; _i++) {
      promise = promiseArray[_i];
      promise.done(_.partial(resolve, promise));
    }
    return Future(d.promise());
  };

  future.join = function() {
    var promises;
    promises = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return Future($.when.apply($, promises).promise());
  };

  future.collect = function(promiseArray) {
    return Future($.when.apply($, promiseArray).promise());
  };

  future.rescue = function(prom, fn) {
    var deferred;
    deferred = $.Deferred();
    prom.fail(function() {
      var args, newPromise;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      newPromise = fn.apply(null, args);
      return newPromise.then(function() {
        var newResults;
        newResults = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return deferred.resolve.apply(deferred, newResults);
      });
    });
    return Future(deferred.promise());
  };

  future.handle = function(prom, fn) {
    var deferred;
    deferred = $.Deferred();
    prom.fail(function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return deferred.reject(fn.apply(null, args));
    });
    return Future(deferred.promise());
  };


  /* OOP style constructors */

  methodize = function(obj, funcName) {
    return function(fn) {
      return future[funcName](obj, fn);
    };
  };

  methods = ['map', 'flatMap', 'handle', 'rescue'];

  window.Future = function(obj) {
    var funcName, _i, _len;
    for (_i = 0, _len = methods.length; _i < _len; _i++) {
      funcName = methods[_i];
      obj[funcName] = methodize(obj, funcName);
    }
    return obj;
  };

}).call(this);
