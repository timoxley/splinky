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
            var next = -1
              , loop = function () {
                  if (++next >= st.length) {
                    res.writeHead(404)
                    return res.end()
                  }
                  st[next](req, res, loop)
                }
            loop()
          }
        })
      }.bind(this))
    }

module.exports = setupServer
module.exports.__meta__ = config