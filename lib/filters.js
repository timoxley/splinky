const async = require('async')

module.exports = setupFilterManager
module.exports.$config = {
    id      : 'filterManager'
  , type    : 'factory'
  , async   : true
  , depends : [ 'options', 'externalSplink' ]
}

function filterManager (globalFilters) {
  // lots of stuff in here for ordering. We order *any* splink filters by their ID
  // no matter where they come from: config (string id), splink scan, or controller
  // config (string id).
  // First come any non-splink (non-string id) filters from config, then any
  // splink filters, ordered by id, then any non-splink (non-string id) filters
  // for the controller

  globalFilters = globalFilters.reduce(function (a, f) {
    return a.concat(f)
  }, [])

  var globalSplinkFilters = globalFilters
        .filter(function (f) { return typeof f == 'string' })
    , globalNonSplinkFilters = globalFilters
        .filter(function (f) { return typeof f != 'string' })
        .map(function (f) { return { filter: f } })


  return function (controllerFilters, callback) {
    if (!Array.isArray(controllerFilters))
      controllerFilters = []
    else {
      globalFilters = globalFilters.reduce(function (a, f) {
        return a.concat(f)
      }, [])
    }

    var controllerSplinkFilters = controllerFilters
          .filter(function (f) { return typeof f == 'string' })
      , controllerNonSplinkFilters = controllerFilters
          .filter(function (f) { return typeof f != 'string' })
          .map(function (f) { return { filter: f } })
      , splinkFilters = globalSplinkFilters
          .concat(controllerSplinkFilters)
          .concat(this.externalSplink.keysByCategory('filter'))
          .sort()

    async.map(
        splinkFilters
      , function (k, callback) {
          var meta = this.externalSplink.meta(k)
          this.externalSplink.byId(k, function (err, filter) {
            if (err)
              return callback(err)
            callback(null, { meta: meta, filter: filter })
          })
        }.bind(this)
      , function (err, splinkFilters) {
          if (err)
            return callback(err)

          var filters = globalNonSplinkFilters
            .concat(splinkFilters)
            .concat(controllerNonSplinkFilters)

          callback(null, filters)
        }
    )
  }
}

function setupFilterManager (callback) {
  var filters = this.options['filters']
  if (!Array.isArray(filters)) filters = []
  callback(null, filterManager(filters))
}