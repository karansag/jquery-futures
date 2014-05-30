###
jquery-futures v.0.0.1
###
partial = (f, args...) -> (more...) -> f.apply(null, Array::concat.call(args, more))
methodize = (obj, funcName) -> (fn) -> Future[funcName](obj, fn)

methods = ['map', 'flatMap', 'handle', 'rescue']
### OOP style constructor ###
window.Future = (obj) ->
  methods.forEach (funcName) -> obj[funcName] = methodize(obj, funcName)
  obj

Future.map = (prom, fn) ->
  d = $.Deferred()
  prom.then(
    (results...) -> d.resolve(fn.apply(null, results)),
    (results...) -> d.reject(results...)
  )
  Future(d.promise())

Future.flatMap = (promise, fn) ->
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


Future.select = (promiseArray) ->
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

  Future(d.promise())

Future.join = (promises...) -> Future $.when(promises...).promise()

Future.collect = (promiseArray) -> Future $.when(promiseArray...).promise()

Future.rescue = (prom, fn) ->
  deferred = $.Deferred();
  prom.done(deferred.resolve)
  prom.fail (args...) ->
    newPromise = fn.apply(null, args)
    newPromise.then (newResults...) ->
      deferred.resolve(newResults...)
  Future deferred.promise()

Future.handle = (prom, fn) ->
  deferred = $.Deferred();
  prom.done(deferred.resolve)
  prom.fail (args...) ->
    deferred.reject(fn.apply(null, args))
  Future deferred.promise()

