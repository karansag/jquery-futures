###
jquery-futures v.0.0.1
###
window.future = window.future or {}

future.map = (prom, fn) ->
  d = $.Deferred()
  prom.then(
    (results...) -> d.resolve(fn.apply(null, results)),
    (results...) -> d.reject(fn.apply(null, results)))
  Future(d.promise())

future.flatMap = (promise, fn) ->
  deferred = $.Deferred()
  reject = (args...) -> deferred.reject(args...)
  ### Note: reject the new deferred if either the inner or outer promise fail ###
  promise.then(
    (results...) ->
      secondPromise = fn.apply(null, results)
      secondPromise.then(
        (otherResults...) -> deferred.resolve.apply(deferred, otherResults),
        reject)
    reject)

  Future(deferred.promise())


future.select = (promiseArray) ->
  d = $.Deferred()
  resolve = (promise, promiseResult) ->
    otherPromises = (p for p in promiseArray if p isnt promise)
    d.resolve(promiseResult, otherPromises)
  (promise.done(_.partial(resolve, promise)) for promise in promiseArray)
  Future(d.promise())

future.join = (promises...) -> Future $.when(promises...).promise()

future.collect = (promiseArray) -> Future $.when(promiseArray...).promise()

future.rescue = (prom, fn) ->
  deferred = $.Deferred();
  prom.fail (args...) ->
    newPromise = fn.apply(null, args)
    newPromise.then (newResults...) ->
      deferred.resolve(newResults...)
  Future deferred.promise()

future.handle = (prom, fn) ->
  deferred = $.Deferred();
  prom.fail (args...) ->
    deferred.reject(fn.apply(null, args))
  Future deferred.promise()

### OOP style constructors ###
methodize = (obj, funcName) -> (fn) -> future[funcName](obj, fn)
methods = ['map', 'flatMap', 'handle', 'rescue']
window.Future = (obj) ->
  (obj[funcName] = methodize(obj, funcName) for funcName in methods)
  obj
