(function() {
    if (!String.prototype.format) {
        String.prototype.format = function() {
            var isUndefined = function(item){
                return typeof(item) === "undefined";
            }
            var args = arguments;
            var using_indices = this.match(/{\d+}/);

            if (using_indices) {
                return this.replace(/{(\d+)}/g, function(match, num) {
                    return isUndefined(args[num]) ? match : args[num];
                });
            } else {
                var i = 0;
                return this.replace(/{}/g, function(match) {
                    var replacement = isUndefined(args[i]) ? match : args[i];
                    i++;
                    return replacement;
                });
            }
        };
    }
})();

beforeEach(function() {
    var matchers = {
        toContainDeferredValue: function(util, customEqualityMatchers) {
            return {
                compare: function(actual, expected) {
                    var deferred = actual;

                    if (!deferred.state() === 'resolved') {
                        return {
                            message : "Deferred is not yet resolved (is {}), cannot yet evaluate against value".format(deferred.state()),
                            pass: false
                        }
                    }
                    var actualValue = null;
                    deferred.done(function(r) {
                        actualValue = r;
                    });
                    deferred.fail(function(r){
                        actualValue = r;
                    })
                    var message =
                        "Expected deferred to contain {} but actually contained {}".format(
                            JSON.stringify(expected), JSON.stringify(actualValue));
                    return util.equals(expected, actualValue, customEqualityMatchers)?
                            {
                                pass: true
                            }:
                            {
                                pass: false,
                                message: message
                            }
                    return result;
                }
            }
        }
    };
    jasmine.addMatchers(matchers);
});