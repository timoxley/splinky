const async          = require('async')
    , paramify       = require('paramify')
    , RequestContext = require('./request-context')

module.exports = initControllers
module.exports.$config = {
    id        : 'controllers'
  , depends   : [ 'router', 'viewManager', 'filterManager', 'externalSplink' ]
}

function writeHtml (req, res, contentType, body) {
  if (!res.getHeader('content-type'))
    res.setHeader('content-type', contentType || 'text/html; charset=utf-8')

  if (!res.getHeader('content-length') && res.getHeader('content-encoding') != 'gzip')
    res.setHeader('content-length', Buffer.isBuffer(body) ? body.length : Buffer.byteLength(body))

  if (req.method != 'HEAD')
    res.end(body)
}

function invokeFilters (filters, ctx, requestContext, callback) {
  var i = 0

  function invokeFilter (filter) {
    // jump right out of this nest if we get err or view arguments
    function filterCallback (err, view) {
      if (err || view)
        return callback(err, view)
      next()
    }

    if (filter.meta && filter.meta.style == 'connect') {
      // connect/express style middleware
      filter.filter.call(ctx, requestContext.request, requestContext.response, filterCallback)
    } else {
      // splinky!
      filter.filter.call(ctx, requestContext, filterCallback)
    }
  }

  function next () {
    if (i == filters.length)
      return callback()
    invokeFilter(filters[i++])
  }

  next()
}

function createInvoker (viewHandler, filters, ctx, handler) {
  return function (req, res, params) {
    // make available any properties Director gives us, like req & res

    var requestContext = new RequestContext(req, res, params)

    function handleView (view) {
      if (typeof viewHandler == 'function') {
        viewHandler(view, requestContext.model, function (err, content) {
          if (err)
            throw err //FIXME

          // special view processor that wants raw access
          if (typeof content == 'function')
            return content(req, res)

          var contentType

          if (typeof content == 'object') {
            // view handler returned an object rather than a string
            // is there a better way than this?
            contentType = content.contentType
            content = content.content
          }

          writeHtml(req, res, contentType, content)
        })
      }
    }

    function invokeHandler () {
      if (handler.length > 1) { // has a callback, ARGH!
        handler.call(ctx, requestContext, function (err, view) {
          if (err)
            throw err //TODO: FIX THIS!!
          handleView(view)
        })
      } else {
        console.error('No-callback handler is deprecated, please remove')
        handleView(handler.call(ctx, requestContext))
      }
    }

    invokeFilters(filters, ctx, requestContext, function (err, view) {
      if (err)
        throw err // TODO: FIX!
      if (view)
        return handleView(view)
      invokeHandler()
    })
  }
}

function initController (key, callback) {
  var meta    = this.externalSplink.meta(key)
    , ctx     = meta.context || {}
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

function initControllers (callback) {
  async.forEach(
      this.externalSplink.keysByCategory('controller')
    , initController.bind(this)
    , callback
  )
}