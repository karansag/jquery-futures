jquery-futures
==============

A toolkit for managing jQuery Deferred and Promise objects. Inspired by Twitter Futures.

[![Build Status](https://travis-ci.org/karansag/jquery-futures.svg?branch=future-wrapper)](https://travis-ci.org/karansag/jquery-futures)

Use to chain computations onto deferred values. For example, to return a promise
that transforms the results of another promise:

    ```javascript
    var d1 = $.Deferred();
    var d2 = future.map(d1, function(value){ return value * value });
    d1.resolve(5);
    d2.done(function(result){
        console.log(result)    // => 25
    });
    ```

Note: this library (including the API) is still very much under construction.
