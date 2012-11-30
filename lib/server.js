var http      = require('http')
  , poweredBy = 'SplinkSMVC v' + require('../package.json').version

  , config    = {
        id      : 'server'
      , type    : 'factory'
      , depends : [ 'router', 'static' ]
    }

  , setupServer = function () {
      var st = this.static || function () { return false }
      return http.createServer(function (req, res) {
        res.setHeader('x-powered-by', poweredBy)
        this.router.dispatch(req, res, function (err) {
          if (err) {
            if (!st(req, res)) {
              res.writeHead(404)
              res.end()
            }
          }
        })
      }.bind(this))
    }

module.exports = setupServer
module.exports.__meta__ = config