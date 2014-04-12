
$.mapProm = function(prom, fn){
    var d = $.Deferred();
    prom.done(function(){
        d.resolve.call(d, fn.apply(null, Array.prototype.slice.call(arguments)));
    });
    return d.promise();
};

$.flatMap = function(promise, f) {
    var deferred = $.Deferred();

    function reject(/* arguments */) {
        // The reject() method puts a deferred into its failure
        // state.
        return deferred.reject.apply(deferred, arguments);
    }

    promise.then(function(/* values... */) {
        var newPromise = f.apply(null, arguments);

        newPromise.then(function(/* newValues... */) {
            deferred.resolve.apply(deferred, arguments);
        }, reject);

    }, reject);

    return deferred.promise();
};


 var once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

$.select = function(promiseArray) {
    var d = $.Deferred();
    var promise;
    var resolve = once(function(firstResult){
        d.resolve(firstResult);
    });
    for(var i=0; i<promiseArray.length; i++) {
         promise = promiseArray[i];
         promise.done(resolve);
    }
    return d.promise();
};