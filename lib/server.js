var http   = require('http')

  , config = {
        id       : 'server'
      , category : 'init'
      , depends  : [ 'router', 'splink' ]
    }

  , setupServer = function () {
      var st = function (req, res) {
            // late binding of the st mount
            var _st = this.splink.byId('st')
            return (st = _st ? _st : function () { return false })(req, res)
          }.bind(this)
        , server = http.createServer(function (req, res) {
            if (st(req, res))
              return
            this.router.dispatch(req, res, function (err) {
              if (err) {
                res.writeHead(404)
                res.end()
              }
            })
          }.bind(this))
      this.splink.reg(server, 'httpServer')
    }

module.exports = setupServer
module.exports.__meta__ = config