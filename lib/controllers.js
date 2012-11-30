var config = {
        id        : 'controllers'
      , depends   : [ 'router', 'viewHandler', 'externalSplink' ]
    }

  , writeHtml = function (req, res, body) {
      if (!res.getHeader('content-type'))
        res.setHeader('content-type', 'text/html; charset=utf-8')
      if (typeof body == 'string')
        body = new Buffer(body)
      if (!res.getHeader('content-length') && body instanceof Buffer)
        res.setHeader('content-length', body.length)
      if (req.method !== 'HEAD')
        res.write(body)
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

  , initController = function (key) {
      var ctx     = {}
        , meta    = this.externalSplink.meta(key)
        , handler = this.externalSplink.byId(key, { bindTo: ctx })
        , routes  = meta.route ? Array.isArray(meta.route) ? meta.route : [ meta.route ] : []
        , method  = meta.method || 'get'
        , invoker = createInvoker(this.viewHandler, ctx, handler)

      routes.forEach(function (route) {
        this.router.on(method, route, invoker)
      }.bind(this))
    }

  , initControllers = function () {
      this.externalSplink.keysByCategory('controller').forEach(initController.bind(this))
    }

module.exports = initControllers
module.exports.__meta__ = config