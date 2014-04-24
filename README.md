jquery-futures
==============

A toolkit for managing jQuery Deferred and Promise objects. Inspired by Twitter Futures.

[![Build Status](https://travis-ci.org/karansag/jquery-futures.svg?branch=master)](https://travis-ci.org/karansag/jquery-futures)

Installation and Dependencies
=============================
Dependencies:
* jquery >= 1.8
* underscore.js >= 1.4.4

To install, simply copy and use src/futures.js.

Examples
==========================
Use to chain computations onto deferred objects. For example, to **map** the results of a promise
future.map (promise, fn => promise)
--------
    var d1 = $.Deferred();
    var d2 = future.map(d1, function(value){ return value * value });
    d1.resolve(5);
    d2.done(function(result){
        console.log(result)    // => 25
    });

Note: this library (including the API) is still very much under construction.

Testing
==================
First, clone the repo.

*Via grunt and phantomjs:*

If you don't already have it, `npm install -g grunt-cli` for the grunt command line tool. Then,
`npm install` the dependencies from `package.json`.

You can run `grunt` for a single
task that compiles coffeescript and then runs jasmine tests or `grunt coffee`/`grunt test` for either one, respectively.
`grunt test` uses phantomjs to headlessly run the jasmine tests.

*Via the jasmine gem and your favorite browser:*

If you prefer a capitate browser, then`bundle install` the dependencies from the `Gemfile` and
run `rake jasmine`. The tests will by default run on port 8888.
