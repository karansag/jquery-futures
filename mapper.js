
$.mapProm = function(prom, fn){
    var d = $.Deferred();
    prom.done(function(){
        d.resolve.apply(d, fn.apply(this, arguments));
    });
    return d.promise();
};

$.flatMap = function(promise, f) {
    var deferred = $.Deferred();

    function reject(/* arguments */) {
        // The reject() method puts a deferred into its failure
        // state.
        deferred.reject.apply(deferred, arguments);
    }

    promise.then(function(/* values... */) {
        var newPromise = f.apply(null, arguments);

        newPromise.then(function(/* newValues... */) {
            deferred.resolve.apply(deferred, arguments);
        }, reject);

    }, reject);

    return deferred.promise();
};
