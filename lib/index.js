const DEFAULT_PORT = 80

var Splink   = require('splink')
  , director = require('director')

  , SplinkSMVC = function (options) {
      var router = new director.http.Router()
        , splink = this._splink = new Splink({
              'options'        : options || {}
            , 'externalSplink' : new Splink()
            , 'router'         : router
          })
      if (typeof options.router == 'object')
        router.configure(options.router)
      splink.reg(splink, 'splink') // this should be done in splink itself
      // scan for internal SplinkSMVC components
      splink.scanPathSync(__dirname)
      // run scans any anything else required
      splink.byId('setup')()
    }

  , start = function (_port, _callback) {
      var port     = this._splink.byId('options').port
            || (typeof _port == 'number' ? _port : DEFAULT_PORT || DEFAULT_PORT)
        , callback = typeof _port == 'function' ? _port : _callback

      // setup any controllers found, attach them to the router
      this._splink.byId('controllers', function (err, controllerManager) {
        controllerManager(function (err) {
          if (err) return callback && callback(err)

          this._splink.byId('server').listen(port)
          console.log('Listening on port', port)

          callback && callback()
        }.bind(this))
      }.bind(this))
    }

SplinkSMVC.prototype = {
    constructor : SplinkSMVC
  , start       : start
}

module.exports = function (options) {
  return new SplinkSMVC(options)
}