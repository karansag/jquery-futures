describe("sequential composition", function() {
    describe("Future.map", function() {
        var orig, newPromise;
        beforeEach(function() {
            orig = $.Deferred();
            newPromise = Future.map(orig.promise(), function(resp) {
                return resp + ' something';
            });
        });
        it("maps successful resolution values", function() {
            orig.resolve('cork');
            expect(newPromise).toContainDeferredValue('cork something');
        });
        it("fails failure values without mapping", function() {
            orig.reject('bottle');
            expect(newPromise).toContainDeferredError('bottle');
        });
    });
    describe("Future.pipe", function() {
        var origPromise, newPromise;
        beforeEach(function() {
          origPromise = $.Deferred();
          var inc = function(x) { return x + 1; };
          var doubleIt = function(x) { return x * 2; };
          newPromise = Future.pipe(origPromise, inc, doubleIt);
        });
        it("pipes a deferred value through the list of functions (equivalent to multiple maps)", function() {
          origPromise.resolve(5);
          expect(newPromise).toContainDeferredValue(12);
        });
    });
    describe("Future.flatMap", function() {
        var outerDeferred, innerFun, newPromise;
        beforeEach(function() {
            innerFunc = function(d) {
                return $.Deferred().resolve(d + 10);
            };
            outerDeferred = $.Deferred();
            newPromise = Future.flatMap(outerDeferred, innerFunc);
        });
        it("chains resolutions if all are succcessful", function() {
            outerDeferred.resolve(2);
            expect(newPromise).toContainDeferredValue(12);
        });
        it("fails the returned promise if the outer deferred fails", function() {
            outerDeferred.reject(5);
            expect(newPromise).toContainDeferredError(5);
        });
        it("fails the returned promise if the inner deferred fails", function() {
            var failedInner = $.Deferred();
            newPromise = Future.flatMap(outerDeferred, function() {
                return failedInner;
            });
            failedInner.reject(10);
            outerDeferred.resolve(2);
            expect(newPromise).toContainDeferredError(10);
        });
    });
});

describe("concurrent composition", function() {
    var d1, d2, d3, result, others;
    beforeEach(function() {
        d1 = $.Deferred();
        d2 = $.Deferred();
        d3 = $.Deferred();
    });
    describe("Future.select", function() {
        describe("successful resolution of the first resolved promise", function() {
            beforeEach(function() {
                Future.select([d1, d2, d3]).done(function(first, rest) {
                    result = first;
                    others = rest;
                });
                d1.resolve(1);
                d2.reject(2);
                d3.resolve(3);
            });
            it("selects the first successful promise", function() {
                expect(result).toEqual(1);
            });
            it("provides the other promises in the result", function() {
                expect(others[0]).toEqual(d2);
                expect(others[1]).toEqual(d3);
            });
        });
        describe("failed resolution of the first resolved promise", function() {
            beforeEach(function() {
                Future.select([d1, d2, d3]).fail(function(first, rest) {
                    result = first;
                    others = rest;
                });
                d1.reject(1);
                d2.resolve(2);
                d3.resolve(3);
            });
            it("selects the first failed promise", function() {
                expect(result).toEqual(1);
            });
            it("provides the other promises in the result", function() {
                expect(others[0]).toEqual(d2);
                expect(others[1]).toEqual(d3);
            });
        });
    });

    describe("Future.collect", function() {
        it("joins a list of Futures together", function() {
            var joinedPromise = Future.collect([d1, d2, d3]);
            var watcher;
            joinedPromise.done(function(res1, res2, res3) {
                watcher = [res1, res2, res3];
            });
            d1.resolve(1);
            expect(watcher).not.toBeDefined();
            d2.resolve(2);
            expect(watcher).not.toBeDefined();
            d3.resolve(3);
            expect(watcher).toEqual([1, 2, 3]);
        });
    });
    describe("Future.join", function() {
        it("joins a varargs number of Futures together", function() {
            var joinedPromise = Future.join(d1, d2, d3);
            var watcher;
            joinedPromise.done(function(res1, res2, res3) {
                watcher = [res1, res2, res3];
            });
            d1.resolve(1);
            expect(watcher).not.toBeDefined();
            d2.resolve(2);
            expect(watcher).not.toBeDefined();
            d3.resolve(3);
            expect(watcher).toEqual([1, 2, 3]);
        });
    });
});

describe("failure states", function() {
    var deferred;
    beforeEach(function() {
        deferred = $.Deferred();
    });
    describe("Future.rescue", function() {
        var innerDeferred;
        beforeEach(function() {
            innerDeferred = $.Deferred();
        });
        it("'rescues' a failure state", function() {
            var newProm = Future.rescue(deferred, function(failArg) {
                return innerDeferred.resolve(failArg + 'xx').promise();
            });
            deferred.reject('failedArg');
            expect(newProm).toContainDeferredValue('failedArgxx');
        });
        it("passes on success cases to the returned promise", function() {
            var newProm = Future.rescue(deferred, function(failArg) {
                return innerDeferred.resolve(failArg + 'xx').promise();
            });
            deferred.resolve('passing!');
            expect(newProm).toContainDeferredValue('passing!');
        });
    });

    describe("Future.handle", function() {
        it("maps a failure onto a new failure", function() {
            var newProm = Future.handle(deferred.promise(), function(failArg) {
                return failArg + 20;
            });
            deferred.reject(7);
            expect(newProm).toContainDeferredError(27);
        });
        it("passes on success cases to the returned promise", function() {
            var newProm = Future.handle(deferred, function(failArg) {
                return innerDeferred.resolve(failArg + 'xx').promise();
            });
            deferred.resolve('passing!');
            expect(newProm).toContainDeferredValue('passing!')
        });
    });
});

describe("wrapping with Future", function() {
    var deferred, wrapped;
    beforeEach(function() {
        deferred = $.Deferred();
        wrapped = Future(deferred);
    });
    it("returns an 'enchanced' deferred/promise", function() {
        expect(wrapped.map).toBeDefined();
        expect(wrapped.flatMap).toBeDefined();
    });
    it("delegates method calls to the corresponding function, passing the called object as the first parameter", function() {
        var result1, result2;
        var newPromise1 = wrapped.map(function(result) {
            return 10 + result;
        }).done(function(result) {
            result1 = result;
        });
        var newPromise2 = Future.map(deferred, function(result) {
            return 10 + result;
        }).done(function(result) {
            result2 = result;
        });
        deferred.resolve(20);
        expect(result1).toEqual(result2);
    });
    it("allows further chaining", function() {
        var result1, result2, result3;
        wrapped.map(function(result) {
            return 5 + result;
        }).done(function(r) {
            result1 = r;
        }).map(function(r) {
            return 10 + r;
        }).done(function(r) {
            result2 = r;
        }).done(function(r) {
            result3 = r;
        });
        deferred.resolve(2);
        expect(result1).toEqual(7);
        expect(result2).toEqual(17);
        expect(result3).toEqual(17);
    });
    it("supports join", function() {
        var result1, result2, result3;
        deferred.resolve(25);
        var joinedPromise = wrapped.join($.Deferred().resolve(100), $.Deferred().resolve(200)).done(function(r1, r2, r3){
            result1 = r1;
            result2 = r2;
            result3 = r3
        });
        expect(result1).toEqual(25);
        expect(result2).toEqual(100);
        expect(result3).toEqual(200);
        expect(joinedPromise.map(function(a, b){ return a + b })).toContainDeferredValue(125);
    });
});

describe('Future.retry', function() {
    var futureClosure, backoffClosure;
    beforeEach(function() {
        jasmine.clock().install();
    });
    afterEach(function() {
        jasmine.clock().uninstall();
    });
    describe("if the query in futureClosure returns successfully before the backoffClosure returns null", function() {
        beforeEach(function() {
            var futureCounter = 0;
            var responses = [$.Deferred().reject("error"), $.Deferred().resolve("success"), $.Deferred().resolve("another success")]
            futureClosure = function(){
                var ret = responses[futureCounter];
                futureCounter++;
                return ret;
            }
            var backoffCounter = 0;
            var backoffSeq = [100, 2000, null];
            backoffClosure = function(){
                var ret = backoffSeq[backoffCounter]
                backoffCounter++;
                return ret;
            };
        });
        it('retries and returns the resolved value', function() {
            retryXHR = Future.retry(futureClosure, backoffClosure);
            expect(retryXHR.state()).toEqual("pending");
            jasmine.clock().tick(101);
            expect(retryXHR).toContainDeferredValue('success');
        });
        describe('edge cases (e.g., timeouts of 0', function() {
            beforeEach(function() {
                var backoffCounter = 0;
                var backoffSeq = [0, 200, null];
                backoffClosure = function(){
                    var ret = backoffSeq[backoffCounter]
                    backoffCounter++;
                    return ret;
                };
            });
            it('should behave the same', function() {
                retryXHR = Future.retry(futureClosure, backoffClosure);
                expect(retryXHR.state()).toEqual("pending");
                jasmine.clock().tick(1);
                expect(retryXHR).toContainDeferredValue('success');
            });
        });
        it('retries and returns the resolved value', function() {
            retryXHR = Future.retry(futureClosure, backoffClosure);
            expect(retryXHR.state()).toEqual("pending");
            jasmine.clock().tick(101);
            expect(retryXHR).toContainDeferredValue('success');
        });
    });
    describe('if the backoffClosure returns null before futureClosure is successful', function() {
        beforeEach(function() {
            var futureCounter = 0;
            var responses = [$.Deferred().reject("error"), $.Deferred().reject("error2"), $.Deferred().resolve("another success")]
            futureClosure = function(){
                var ret = responses[futureCounter];
                futureCounter++;
                return ret;
            }
            var backoffCounter = 0;
            var backoffSeq = [100, null];
            backoffClosure = function(){
                var ret = backoffSeq[backoffCounter]
                backoffCounter++;
                return ret;
            };
        });
        it('retries but returns the failure value', function() {
            retryXHR = Future.retry(futureClosure, backoffClosure);
            expect(retryXHR.state()).toEqual("pending");
            jasmine.clock().tick(101);
            expect(retryXHR).toContainDeferredError('error2');
        });
    });
});

describe('Future.retryWithConstantBackoff', function() {
    var futureClosure;
    beforeEach(function() {
        jasmine.clock().install();
        spyOn(Future, 'retry').and.callThrough();
    });
    afterEach(function() {
        jasmine.clock().uninstall();
    });
    describe("if the query returns successfully", function() {
        beforeEach(function() {
            var futureCounter = 0;
            var responses = [$.Deferred().reject("error"), $.Deferred().reject("error2"), $.Deferred().resolve("success")]
            futureClosure = function(){
                var ret = responses[futureCounter];
                futureCounter++;
                return ret;
            }
        });
        it('retries and returns the resolved value', function() {
            retryXHR = Future.retryWithConstantBackoff(futureClosure, 150, 3);
            expect(retryXHR.state()).toEqual("pending");
            jasmine.clock().tick(151);
            expect(retryXHR.state()).toEqual("pending");
            jasmine.clock().tick(151);
            expect(retryXHR).toContainDeferredValue('success');
        });
    });
    describe("if the queries all fail", function() {
        beforeEach(function() {
            var futureCounter = 0;
            var responses = [$.Deferred().reject("error"), $.Deferred().reject("error2"), $.Deferred().resolve("success")]
            futureClosure = function(){
                var ret = responses[futureCounter];
                futureCounter++;
                return ret;
            }
        });
        it('retries and returns the resolved value', function() {
            retryXHR = Future.retryWithConstantBackoff(futureClosure, 150, 2);
            expect(retryXHR.state()).toEqual("pending");
            jasmine.clock().tick(151);
            expect(retryXHR).toContainDeferredError("error2");
        });
    });
});