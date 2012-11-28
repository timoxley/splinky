const DEFAULT_PORT = 80

var Splink   = require('splink')
  , director = require('director')

  , SplinkSMVC = function (options) {
      var splink = this._splink = new Splink({
          'options'        : options || {}
        , 'externalSplink' : new Splink()
        , 'router'         : new director.http.Router()
      })
      splink.reg(splink, 'splink') // this should be done in splink itself
      splink.scanPathSync(__dirname)
      splink.byId('setup')()
      splink.byCategory('init').forEach(function (k) { k() })
    }

  , start = function (port) {
      port = port || this._splink.byId('options').port || DEFAULT_PORT
      this._splink.byId('httpServer').listen(port)
      console.log('Listening on port', port)
    }

SplinkSMVC.prototype = {
    constructor : SplinkSMVC
  , start       : start
}

module.exports = function (options) {
  return new SplinkSMVC(options)
}