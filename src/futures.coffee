###
jquery-futures v.0.0.1
###
partial = (f, args...) -> (more...) -> f.apply(null, Array::concat.call(args, more))
methodize = (obj, funcName) -> (fn) -> future[funcName](obj, fn)

methods = ['map', 'flatMap', 'handle', 'rescue']
### OOP style constructor ###
window.future = (obj) ->
  methods.forEach (funcName) -> obj[funcName] = methodize(obj, funcName)
  obj

future.map = (prom, fn) ->
  d = $.Deferred()
  prom.then(
    (results...) -> d.resolve(fn.apply(null, results)),
    (results...) -> d.reject(results...)
  )
  future(d.promise())

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

  future(deferred.promise())


future.select = (promiseArray) ->
  d = $.Deferred()
  resolve = (promise, promiseResult) ->
    otherPromises = promiseArray.filter (p) -> p != promise
    d.resolve(promiseResult, otherPromises)
  reject = (promise, promiseResult) ->
    otherPromises = promiseArray.filter (p) -> p != promise
    d.reject(promiseResult, otherPromises)
  promiseArray.forEach (promise) ->
    promise.done(partial(resolve, promise))
    promise.fail(partial(reject, promise))

  future(d.promise())

future.join = (promises...) -> future $.when(promises...).promise()

future.collect = (promiseArray) -> future $.when(promiseArray...).promise()

future.rescue = (prom, fn) ->
  deferred = $.Deferred();
  prom.fail (args...) ->
    newPromise = fn.apply(null, args)
    newPromise.then (newResults...) ->
      deferred.resolve(newResults...)
  future deferred.promise()

future.handle = (prom, fn) ->
  deferred = $.Deferred();
  prom.fail (args...) ->
    deferred.reject(fn.apply(null, args))
  future deferred.promise()

