
/*
jquery-futures v.0.1.0
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
      return Future[funcName](obj, fn);
    };
  };

  methods = ['map', 'flatMap', 'handle', 'rescue'];


  /* OOP style constructor */

  window.Future = function(obj) {
    methods.forEach(function(funcName) {
      return obj[funcName] = methodize(obj, funcName);
    });
    return obj;
  };

  Future.VERSION = '0.1.0';

  Future.map = function(prom, fn) {
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
    return Future(d.promise());
  };

  Future.flatMap = function(promise, fn) {
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

  Future.select = function(promiseArray) {
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
    return Future(d.promise());
  };

  Future.join = function() {
    var promises;
    promises = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return Future($.when.apply($, promises).promise());
  };

  Future.collect = function(promiseArray) {
    return Future($.when.apply($, promiseArray).promise());
  };

  Future.rescue = function(prom, fn) {
    var deferred;
    deferred = $.Deferred();
    prom.done(deferred.resolve);
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

  Future.handle = function(prom, fn) {
    var deferred;
    deferred = $.Deferred();
    prom.done(deferred.resolve);
    prom.fail(function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return deferred.reject(fn.apply(null, args));
    });
    return Future(deferred.promise());
  };

}).call(this);
