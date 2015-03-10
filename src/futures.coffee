###
jquery-futures v.0.2.2
Karan Sagar
###
partial = (f, args...) -> (more...) -> f.apply(null, Array::concat.call(args, more))
methodize = (obj, funcName) -> (rest_args...) -> Future[funcName](obj, rest_args...)
methods = ['map', 'flatMap', 'handle', 'rescue', 'pipe', 'join']
### OOP style constructor ###
window.Future = (obj) ->
  methods.forEach (funcName) -> obj[funcName] = methodize(obj, funcName)
  obj

Future.VERSION = '0.2.1'

Future.pipe = (prom, fns...) ->
  d = $.Deferred()
  firstFn = fns[0]
  restFns = fns.slice(1)

  pipe = (seed) ->
    firstResult = firstFn.apply(null, seed)
    restFns.reduce(
      (acc, f) -> f(acc),
      firstResult)

  prom.then(
    (results...) -> d.resolve(pipe(results)),
    (results...) -> d.reject(results...)
    )
  Future(d.promise())

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

window.Future.Util = Future.Util or {}

Future.Util.retry = (futureClosure, backoffClosure) ->
  successXHR = $.Deferred()
  retryingFunc = ->
    futureClosure().done(->
        successXHR.resolve.apply(successXHR, arguments)
      ).fail(->
        backoffValue = backoffClosure()
        if backoffValue == null
          successXHR.reject.apply(successXHR, arguments)
        else
          setTimeout(retryingFunc, backoffValue)
      )
  retryingFunc()
  successXHR
