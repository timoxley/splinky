var async  = require('async')

  , config = {
        id        : 'controllers'
      , depends   : [ 'router', 'viewHandler', 'externalSplink' ]
    }

  , writeHtml = function (req, res, body) {
      if (!res.getHeader('content-type'))
        res.setHeader('content-type', 'text/html; charset=utf-8')
      if (!res.getHeader('content-length'))
        res.setHeader('content-length', Buffer.isBuffer(body) ? body.length : Buffer.byteLength(body))
      if (req.method != 'HEAD')
        res.end(body)
    }

  , createInvoker = function (viewHandler, ctx, handler) {
      var viewHandler
      return function () {
        // make available any properties Director gives us, like req & res
        ctx.__proto__ = this
        var model = ctx.model = {}
          , view = handler.call(ctx)

        if (typeof view == 'string' && typeof viewHandler == 'function') {
          viewHandler(view, model, function (err, content) {
            if (err) throw err //FIXME
            writeHtml(this.req, this.res, content)
          }.bind(this))
        }
      }
    }

  , initController = function (key, callback) {
      var ctx     = {}
        , meta    = this.externalSplink.meta(key)
        , routes  = meta.route ? Array.isArray(meta.route) ? meta.route : [ meta.route ] : []
        , method  = meta.method || 'get'

      this.externalSplink.byId(key, { bindTo: ctx }, function (err, handler) {
        if (err) return callback(err)

        var invoker = createInvoker(this.viewHandler, ctx, handler)
        routes.forEach(function (route) {
          this.router.on(method, route, invoker)
        }.bind(this))

        callback()
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