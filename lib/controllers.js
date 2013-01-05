var async  = require('async')

  , config = {
        id        : 'controllers'
      , depends   : [ 'router', 'viewManager', 'filterManager', 'externalSplink' ]
    }

  , writeHtml = function (req, res, contentType, body) {
      if (!res.getHeader('content-type'))
        res.setHeader('content-type', contentType || 'text/html; charset=utf-8')

      if (!res.getHeader('content-length') && res.getHeader('content-encoding') != 'gzip')
        res.setHeader('content-length', Buffer.isBuffer(body) ? body.length : Buffer.byteLength(body))

      if (req.method != 'HEAD') {
        res.write(body)
        res.end()
      }
    }

  , invokeFilters = function (filters, req, res, callback) {
      async.forEachSeries(
          filters
        , function (filter, callback) {
            filter(req, res, callback)
          }
        , callback
      )
    }

  , createInvoker = function (viewHandler, filters, ctx, handler) {
      var viewHandler
      return function () {
        // make available any properties Director gives us, like req & res
        ctx.__proto__ = this

        var args = Array.prototype.slice.call(arguments)
          , model = ctx.model = {}

          , handleView = function (view) {
              if (typeof view == 'string' && typeof viewHandler == 'function') {
                viewHandler(view, model, function (err, content) {
                  if (err) throw err //FIXME

                  writeHtml(
                      this.req
                    , this.res
                    , viewHandler.contentType // a better way than this?
                    , content
                  )
                }.bind(this))
              }
            }.bind(this)

          , invokeHandler = function () {
              if (handler.length > args.length) {
                handler.apply(
                    ctx
                  , args.concat([ function (err, view) {
                      if (err) throw err //TODO: FIX THIS!!
                      handleView(view)
                    }])
                )
              } else
                handleView(handler.apply(ctx, arguments))
            }.bind(this)

        invokeFilters(filters, this.req, this.res, function (err) {
          if (err) throw err // TODO: FIX!
          invokeHandler()
        })
      }
    }

  , initController = function (key, callback) {
      var ctx     = {}
        , meta    = this.externalSplink.meta(key)
        , routes  = meta.route ? Array.isArray(meta.route) ? meta.route : [ meta.route ] : []
        , method  = meta.method || 'get'
        , viewHandler = this.viewManager(meta.viewProcessors || meta.viewProcessor)

      this.externalSplink.byId(key, { bindTo: ctx }, function (err, handler) {
        if (err) return callback(err)

        this.filterManager(meta.filters, function (err, filters) {
          if (err) return callback(err)

          var invoker = createInvoker(viewHandler, filters, ctx, handler)
          routes.forEach(function (route) {
            this.router.on(method, route, invoker)
          }.bind(this))

          callback()
        }.bind(this))
      }.bind(this))
    }

  , initControllers = function (callback) {
      async.forEach(
          this.externalSplink.keysByCategory('controller')
        , initController.bind(this)
        , callback
      )
    }

module.exports = initControllers
module.exports.__meta__ = config