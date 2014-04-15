$.mapProm = (prom, fn) ->
  d = $.Deferred()
  prom.then(
    (results...) -> d.resolve(fn.apply(null, results)),
    (results...) -> d.reject(fn.apply(null, results)))
  Future(d.promise())

$.flatMap = (promise, fn) ->
  deferred = $.Deferred()
  reject = (args...) -> deferred.reject(args...)
  # Note: reject the new deferred if either the inner or outer promise fail
  promise.then(
    (results...) ->
      secondPromise = fn.apply(null, results)
      secondPromise.then(
        (otherResults...) -> deferred.resolve.apply(deferred, otherResults),
        reject)
    reject)

  deferred.promise()


$.select = (promiseArray) ->
  d = $.Deferred()
  resolve = (promise, promiseResult) ->
    otherPromises = (p for p in promiseArray if p isnt promise)
    d.resolve(promiseResult, otherPromises)
  (promise.done(_.partial(resolve, promise)) for promise in promiseArray)
  d.promise()

$.join = (promises...) -> $.when(promises...).promise()

$.collect = (promiseArray) -> $.when(promiseArray...).promise()

$.rescue = (prom, fn) ->
  deferred = $.Deferred();
  prom.fail (args...) ->
    newPromise = fn.apply(null, args)
    newPromise.then (newResults...) ->
      deferred.resolve(newResults...)
  deferred.promise()

$.handle = (prom, fn) ->
  deferred = $.Deferred();
  prom.fail (args...) ->
    deferred.reject(fn.apply(null, args))
  deferred.promise()

methodize = (obj, funcName) -> (fn) -> $[funcName](obj, fn)
futuredMethod = (obj, funcName) -> _.compose(obj[funcName], Future)
methods = ['mapProm', 'flatMap', 'handle', 'rescue']
enchanced = ['done']
window.Future = (obj) ->
  (obj[funcName] = methodize(obj, funcName) for funcName in methods)
  (obj[f] = futuredMethod(obj, f) for f in enchanced)
  obj
