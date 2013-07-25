const DEFAULT_PORT = 80

const Splink = require('splink')
    , Router = require('./router')

function SplinkSMVC (options) {
  if (!(this instanceof SplinkSMVC))
    return new SplinkSMVC(options)

  var router = Router(typeof options.router == 'object' ? options.router : undefined)
    , splink = this._splink = new Splink({
          'options'        : options || {}
        , 'externalSplink' : new Splink()
        , 'router'         : router
      })
  splink.reg(splink, 'splink') // this should be done in splink itself
  // scan for internal SplinkSMVC components
  splink.scanPathSync(__dirname)
  // run scans any anything else required
  splink.byId('setup')()
}

SplinkSMVC.prototype.start = function (_port, _callback) {
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

module.exports = SplinkSMVC