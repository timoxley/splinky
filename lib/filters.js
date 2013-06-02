const async = require('async')
    , config = {
          id      : 'filterManager'
        , type    : 'factory'
        , async   : true
        , depends : [ 'options', 'externalSplink' ]
      }

var filterManager = function (globalFilters) {
      // lots of stuff in here for ordering. We order *any* splink filters by their ID
      // no matter where they come from: config (string id), splink scan, or controller
      // config (string id).
      // First come any non-splink (non-string id) filters from config, then any
      // splink filters, ordered by id, then any non-splink (non-string id) filters
      // for the controller

      var globalSplinkFilters =
            globalFilters.filter(function (f) { return typeof f == 'string' })
        , globalNonSplinkFilters =
            globalFilters.filter(function (f) { return typeof f != 'string' })

      return function (controllerFilters, callback) {
        if (!Array.isArray(controllerFilters)) controllerFilters = []
        var controllerSplinkFilters =
              controllerFilters.filter(function (f) { return typeof f == 'string' })
          , controllerNonSplinkFilters =
              controllerFilters.filter(function (f) { return typeof f != 'string' })
          , splinkFilters = globalSplinkFilters
              .concat(controllerSplinkFilters)
              .concat(this.externalSplink.keysByCategory('filter'))
              .sort()

        async.map(
            splinkFilters
          , function (k, callback) {
              this.externalSplink.byId(k, callback)
            }.bind(this)
          , function (err, splinkFilters) {
              if (err) return callback(err)
              var filters = globalNonSplinkFilters
                .concat(splinkFilters)
                .concat(controllerNonSplinkFilters)
              filters = filters.reduce(function (a, f) {
                return a.concat(Array.isArray(f) ? f : [ f ])
              }, [])
              callback(null, filters)
            }
        )
      }
    }

  , setupFilterManager = function (callback) {
      var filters = this.options['filters']
      if (!Array.isArray(filters)) filters = []
      callback(null, filterManager(filters))
    }

module.exports = setupFilterManager
module.exports.$config = config