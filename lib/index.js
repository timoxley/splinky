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
      // scan for internal SplinkSMVC components
      splink.scanPathSync(__dirname)
      // run scans any anything else required
      splink.byId('setup')()
      // setup any controllers found, attach them to the router
      splink.byId('controllers')()
    }

  , start = function (port) {
      port = port || this._splink.byId('options').port || DEFAULT_PORT
      this._splink.byId('server').listen(port)
      console.log('Listening on port', port)
    }

SplinkSMVC.prototype = {
    constructor : SplinkSMVC
  , start       : start
}

module.exports = function (options) {
  return new SplinkSMVC(options)
}