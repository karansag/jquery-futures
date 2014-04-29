describe("sequential composition", function() {
  describe("future.map", function() {
    var orig, newPromise, result;
    beforeEach(function() {
      result = void 0;
      orig = $.Deferred();
      newPromise = future.map(orig.promise(), function(resp) {
        return resp + ' something';
      });
    });
    it("maps successful resolution values", function() {
      orig.resolve('cork');
      newPromise.done(function(r) {
        result = r;
      });
      expect(result).toEqual('cork something');
    });
    it("fails failure values without mapping", function() {
      orig.reject('bottle');
      newPromise.fail(function(r) {
        result = r;
      });
      expect(result).toEqual('bottle');
    });
  });
  describe("future.flatMap", function() {
    var outerDeferred, innerFun, newPromise;
    beforeEach(function() {
      innerFunc = function(d) {
        return $.Deferred().resolve(d + 10);
      };
      outerDeferred = $.Deferred();
      newPromise = future.flatMap(outerDeferred, innerFunc);
    });
    it("chains resolutions if all are succcessful", function() {
      var result;
      outerDeferred.resolve(2);
      newPromise.done(function(r) {
        result = r;
      });
      expect(result).toEqual(12);
    });
    it("fails the returned promise if the outer deferred fails", function() {
      outerDeferred.reject(5);
      var result;
      newPromise.fail(function(r) {
        result = r;
      });
      expect(result).toEqual(5);
    });
    it("fails the returned promise if the inner deferred fails", function() {
      var result;
      var failedInner = $.Deferred();
      newPromise = future.flatMap(outerDeferred, function() {
        return failedInner;
      });
      failedInner.reject(10);
      outerDeferred.resolve(2);
      newPromise.fail(function(r) {
        result = r;
      });
      expect(result).toEqual(10);
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
  describe("future.select", function() {
    describe("successful resolution of the first resolved promise", function() {
      beforeEach(function() {
        future.select([d1, d2, d3]).done(function(first, rest) {
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
        future.select([d1, d2, d3]).fail(function(first, rest) {
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

  describe("future.collect", function() {
    it("joins a list of futures together", function() {
      var joinedPromise = future.collect([d1, d2, d3]);
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
  describe("future.join", function() {
    it("joins a varargs number of futures together", function() {
      var joinedPromise = future.join(d1, d2, d3);
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
  describe("future.rescue", function() {
    var innerDeferred;
    beforeEach(function() {
      innerDeferred = $.Deferred();
    });
    it("'rescues' a failure state", function() {
      var newProm = future.rescue(deferred, function(failArg) {
        return innerDeferred.resolve(failArg + 'xx').promise();
      });
      deferred.reject('failedArg');
      var watcher;
      newProm.done(function(arg) {
        watcher = arg;
      });
      expect(watcher).toEqual('failedArgxx');
    });
  });

  describe("future.handle", function() {
    beforeEach(function() {

    });
    it("maps a failure onto a new failure", function() {
      var newProm = future.handle(deferred.promise(), function(failArg) {
        return failArg + 20;
      });
      deferred.reject(7);
      var watcher;
      newProm.fail(function(result) {
        watcher = result;
      });
      expect(watcher).toEqual(27);
    });
  });
});

describe("wrapping with future", function() {
  var deferred, wrapped;
  beforeEach(function() {
    deferred = $.Deferred();
    wrapped = future(deferred);
  });
  it("returns an 'enchanced' deferred/promise", function() {
    expect(wrapped.map).toBeDefined();
    expect(wrapped.flatMap).toBeDefined();
  });
  it("does the right OO thing", function() {
    var result1, result2;
    var newPromise1 = wrapped.map(function(result) {
      return 10 + result;
    }).done(function(result) {
      result1 = result;
    });
    var newPromise2 = future.map(deferred, function(result) {
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
});
