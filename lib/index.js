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
    }

  , start = function (port, callback) {
      // setup any controllers found, attach them to the router
      this._splink.byId('controllers')(function (err) {
        if (err) return callback && callback(err)

        port = port || this._splink.byId('options').port || DEFAULT_PORT
        this._splink.byId('server').listen(port)
        console.log('Listening on port', port)

        callback && callback()
      }.bind(this))
    }

SplinkSMVC.prototype = {
    constructor : SplinkSMVC
  , start       : start
}

module.exports = function (options) {
  return new SplinkSMVC(options)
}