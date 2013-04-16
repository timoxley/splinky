var http      = require('http')
  , poweredBy = 'SplinkSMVC v' + require('../package.json').version

  , config    = {
        id      : 'server'
      , type    : 'factory'
      , depends : [ 'router', 'static' ]
    }

  , setupServer = function () {
      var st = this.static
      return http.createServer(function (req, res) {
        res && res.setHeader('x-powered-by', poweredBy)
        this.router.dispatch(req, res, function (err) {
          if (err) {
            if (!st.some(function (st) { return st(req, res) })) {
              res.writeHead(404)
              res.end()
            }
          }
        })
      }.bind(this))
    }

module.exports = setupServer
module.exports.__meta__ = config