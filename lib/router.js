const paramify = require('paramify')

function Router () {
  if (!(this instanceof Router))
    return new Router()

  this._routes = {}
}

Router.prototype.on = function (method, route, handler) {
  var _m = method.toLowerCase()
  if (!this._routes[_m])
    this._routes[_m] = []
  this._routes[_m].push({ route: route, handler: handler })
}

Router.prototype.dispatch = function (req, res, callback) {
  var method = req.method.toLowerCase()
    , url    = (req.url || '').replace(/\?.*$/, '')
    , match  = paramify(url)
    , routes = this._routes[method]
    , i

  if (routes) {
    for(i = 0; i < routes.length; i++) {
      if (match(routes[i].route))
        return routes[i].handler(req, res, match.params)
    }
  }

  callback(new Error('not found'))
}

module.exports = Router