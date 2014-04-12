describe("$.mapProm", function() {
  it("returns a promise that resolves to the map of the original's value", function() {
    var orig = $.Deferred();
    var newPromise = $.mapProm(orig.promise(), function(resp){ return resp + ' something'});
    orig.resolve('cork');
    var doneRun = 0;
    newPromise.done(function(result){
      doneRun = 1;
      expect(result).toEqual('cork something');
    });
    expect(doneRun).toEqual(1);
  });
});

describe("$.flatMap", function() {
  var outerDeferred, innerFunc;
  beforeEach(function() {
    innerFunc = function(d){
      return $.Deferred().resolve(d + 10);
    };
    outerDeferred = $.Deferred();
  });
  it("flatMaps the original function with the new one", function() {
    var newPromise = $.flatMap(outerDeferred, innerFunc);
    outerDeferred.resolve(2);
    var doneRun = 0;
    newPromise.done(function(result){
      doneRun = 1;
      expect(result).toEqual(12);
    });
    expect(doneRun).toEqual(1);
  });
});

describe("$.select", function() {
  var d1, d2, d3, callback;
  beforeEach(function() {
    d1 = $.Deferred();
    d2 = $.Deferred();
    d3 = $.Deferred();
  });
  it("selects the first successful deferred", function() {
    var result;
    $.select([d1, d2, d3]).done(function(first, rest){
      result = first;
    });
    d1.resolve(1);
    d2.resolve(2);
    d3.resolve(3);
    expect(result).toEqual(1);
  });
  it("provides the other promises in the result", function(){
    var others;
    $.select([d1, d2, d3]).done(function(first, rest){
      others = rest;
    });
    d1.resolve(1);
    d2.resolve(2);
    d3.resolve(3);
    expect(others[1]).toEqual(d2);
    expect(others[0]).toEqual(d1);
  });
});
