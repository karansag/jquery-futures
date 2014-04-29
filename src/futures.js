
/*
jquery-futures v.0.0.1
 */

(function() {
  var methodize, methods, partial,
    __slice = [].slice;

  partial = function() {
    var args, f;
    f = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return function() {
      var more;
      more = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return f.apply(null, Array.prototype.concat.call(args, more));
    };
  };

  methodize = function(obj, funcName) {
    return function(fn) {
      return future[funcName](obj, fn);
    };
  };

  methods = ['map', 'flatMap', 'handle', 'rescue'];


  /* OOP style constructor */

  window.future = function(obj) {
    methods.forEach(function(funcName) {
      return obj[funcName] = methodize(obj, funcName);
    });
    return obj;
  };

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
      return d.reject.apply(d, results);
    });
    return future(d.promise());
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
    return future(deferred.promise());
  };

  future.select = function(promiseArray) {
    var d, reject, resolve;
    d = $.Deferred();
    resolve = function(promise, promiseResult) {
      var otherPromises;
      otherPromises = promiseArray.filter(function(p) {
        return p !== promise;
      });
      return d.resolve(promiseResult, otherPromises);
    };
    reject = function(promise, promiseResult) {
      var otherPromises;
      otherPromises = promiseArray.filter(function(p) {
        return p !== promise;
      });
      return d.reject(promiseResult, otherPromises);
    };
    promiseArray.forEach(function(promise) {
      promise.done(partial(resolve, promise));
      return promise.fail(partial(reject, promise));
    });
    return future(d.promise());
  };

  future.join = function() {
    var promises;
    promises = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return future($.when.apply($, promises).promise());
  };

  future.collect = function(promiseArray) {
    return future($.when.apply($, promiseArray).promise());
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
    return future(deferred.promise());
  };

  future.handle = function(prom, fn) {
    var deferred;
    deferred = $.Deferred();
    prom.fail(function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return deferred.reject(fn.apply(null, args));
    });
    return future(deferred.promise());
  };

}).call(this);
