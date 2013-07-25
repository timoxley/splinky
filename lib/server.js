const http      = require('http')
    , https     = require('https')
    , poweredBy = 'SplinkSMVC v' + require('../package.json').version

module.exports = setupServer
module.exports.$config    = {
    id      : 'server'
  , type    : 'factory'
  , depends : [ 'router', 'static', 'options' ]
}

function createServer (options, callback) {
  if (options && options.ssl)
    return https.createServer(options.ssl, callback)
  return http.createServer(callback)
}

function setupServer () {
  var st = this.static
  return createServer(this.options, function (req, res) {
    res && res.setHeader('x-powered-by', poweredBy)
    if (req) {
      // required for director's body parsing
      req.chunks = []
      req.on('data', function (chunk) {
        req.chunks.push(chunk.toString())
      })
    }
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