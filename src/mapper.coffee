$.mapProm = (prom, fn) ->
  d = $.Deferred()
  prom.done (results...)->
    d.resolve.call d, fn.apply(null, results)
    return
  d.promise()

$.flatMap = (promise, f) ->
  deferred = $.Deferred()
  promise.then (results...)->
    newPromise = f.apply(null, results)
    newPromise.then (otherResults...) ->
      deferred.resolve.apply(deferred, otherResults)
  deferred.promise()


$.select = (promiseArray) ->
  d = $.Deferred()
  resolve = (promise, promiseResult) ->
    otherPromises = (p for p in promiseArray if p isnt promise)
    d.resolve(promiseResult, otherPromises)
  (promise.done(_.partial(resolve, promise)) for promise in promiseArray)
  d.promise()
