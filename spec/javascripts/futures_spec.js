describe("sequential composition", function() {
  describe("$.mapProm", function() {
    var orig;
    beforeEach(function () {
        orig = $.Deferred();
    });
    it("maps successful resolution values", function() {
        var newPromise = $.mapProm(orig.promise(), function(resp) {
          return resp + ' something'
        });
        orig.resolve('cork');
        var doneRun = 0;
        newPromise.done(function(result) {
          doneRun = 1;
          expect(result).toEqual('cork something');
        });
        expect(doneRun).toEqual(1);
      });
    it("maps failure values", function () {
      var newPromise = $.mapProm(orig.promise(), function(resp) {
        return resp + ' something else';
      });
      orig.reject('foot');
      var doneRun = 0;
      newPromise.fail(function(result) {
        doneRun = 1;
        expect(result).toEqual('foot something else');
      });
      expect(doneRun).toEqual(1);
    });
  });
  describe("$.flatMap", function() {
    var outerDeferred, innerFun, newPromise;
    beforeEach(function() {
      innerFunc = function(d) {
        return $.Deferred().resolve(d + 10);
      };
      outerDeferred = $.Deferred();
      newPromise = $.flatMap(outerDeferred, innerFunc);
    });
    it("chains resolutions if all are succcessful", function() {
      outerDeferred.resolve(2);
      var doneRun = 0;
      newPromise.done(function(result) {
        doneRun = 1;
        expect(result).toEqual(12);
      });
      expect(doneRun).toEqual(1);
    });
    it("fails the returned promise if the outer deferred fails", function () {
      outerDeferred.reject(5);
      var doneRun = 0;
      newPromise.fail(function(result) {
        doneRun = 1;
        expect(result).toEqual(5);
      });
      expect(doneRun).toEqual(1);
    });
    it("fails the returned promise if the inner deferred fails", function () {
      var failedInner = $.Deferred();
      newPromise = $.flatMap(outerDeferred, function(){
        return failedInner;
      });
      failedInner.reject(10);
      outerDeferred.resolve(2);
      newPromise.fail(function(result) {
        doneRun = 1;
        expect(result).toEqual(10);
      });
      expect(doneRun).toEqual(1);
    });
  });
});

describe("concurrent composition", function() {
  var d1, d2, d3;
  beforeEach(function() {
    d1 = $.Deferred();
    d2 = $.Deferred();
    d3 = $.Deferred();
  });
  describe("$.select", function() {
    it("selects the first successful deferred", function() {
      var result;
      $.select([d1, d2, d3]).done(function(first, rest) {
        result = first;
      });
      d1.resolve(1);
      d2.resolve(2);
      d3.resolve(3);
      expect(result).toEqual(1);
    });
    it("provides the other promises in the result", function() {
      var others;
      $.select([d1, d2, d3]).done(function(first, rest) {
        others = rest;
      });
      d1.resolve(1);
      d2.resolve(2);
      d3.resolve(3);
      expect(others[1]).toEqual(d2);
      expect(others[0]).toEqual(d1);
    });
  });

  describe("$.collect", function() {
    it("joins a list of futures together", function() {
      var joinedPromise = $.collect([d1, d2, d3]);
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
  describe("$.join", function() {
    it("joins a varargs number of futures together", function() {
      var joinedPromise = $.join(d1, d2, d3);
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
  describe("$.rescue", function() {
    var innerDeferred;
    beforeEach(function() {
      innerDeferred = $.Deferred();
    });
    it("'rescues' a failure state", function() {
      var newProm = $.rescue(deferred, function(failArg) {
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

  describe("$.handle", function() {
    beforeEach(function() {

    });
    it("maps a failure onto a new failure", function() {
      var newProm = $.handle(deferred.promise(), function(failArg) {
        return failArg + 20;
      })
      deferred.reject(7);
      var watcher;
      newProm.fail(function(result) {
        watcher = result;
      });
      expect(watcher).toEqual(27);
    });
  });
});

describe("wrapping with Future", function () {
  var deferred, wrapped;
  beforeEach(function () {
    deferred = $.Deferred();
    wrapped = Future(deferred);
  });
  it("returns an 'enchanced' deferred/promise", function () {
    expect(wrapped.mapProm).toBeDefined();
    expect(wrapped.flatMap).toBeDefined();
  });
  it("does the right OO thing", function () {
    var result1, result2;
    var newPromise1 = wrapped.mapProm(function(result){
      return 10 + result;
    }).done(function(result){ result1 = result;});
    var newPromise2 = $.mapProm(deferred, function(result){
      return 10 + result;}).done(function(result){ result2 = result;});
    deferred.resolve(20);
    expect(result1).toEqual(result2)
  });
  it("allows further chaining", function () {
    var result1, result2;
    wrapped.mapProm(function(result){ return 5 + result; }).done(function(r){
      result1 = r;
    }).mapProm(function(r){ return 10 + r; }).done(function(r){ result2 = r;});
    deferred.resolve(2);
    expect(result1).toEqual(7);
    expect(result2).toEqual(17);
  });
});
