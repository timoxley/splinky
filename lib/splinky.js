const DEFAULT_PORT = 80

const Splink = require('splink')
    , Router = require('./router')

function SplinkSMVC (options) {
  if (!(this instanceof SplinkSMVC))
    return new SplinkSMVC(options)

  this._options     = options || {}
  this._initialised = false
}

// optional static serving config/paths, can be called
// multiple times
SplinkSMVC.prototype.static = function (options) {
  if (this._options.static) {
    if (!Array.isArray(this._options.static))
      this._options.static = [ this._options.static ]
    if (Array.isArray(options))
      this._options.static = this._options.static.concat(options)
    else
      this._options.static.push(options)
  } else
    this._options.static = options

  return this
}

// optional ssl config
SplinkSMVC.prototype.ssl = function (options) {
  this._options.ssl = options
  return this
}

SplinkSMVC.prototype.scan = function (path) {
  if (!this._options.scan)
    this._options.scan = []
  if (Array.isArray(path))
    this._options.scan = this._options.scan.concat(path)
  else
    this._options.scan.push(path)
  return this
}

SplinkSMVC.prototype.views = function (options) {
  if (!this._options.views)
    this._options.views = []
  if (Array.isArray(options))
    this._options.views = this._options.views.concat(options)
  else
    this._options.views.push(options)
  return this
}

SplinkSMVC.prototype.init = function () {
  if (this._initialised)
    return this

  var router = Router(typeof this._options.router == 'object'
        ? this._options.router
        : undefined
      )
    , splink = this._splink = new Splink({
          'options'        : this._options || {}
        , 'externalSplink' : new Splink()
        , 'router'         : router
      })

  splink.reg(splink, 'splink') // this should be done in splink itself
  // scan for internal SplinkSMVC components
  splink.scanPathSync(__dirname)
  // run scans any anything else required
  splink.byId('setup')()

  this._initialised = true
  return this
}

SplinkSMVC.prototype.listen =
SplinkSMVC.prototype.start  = function (_port, _callback) {
  this.init()

  var port = this._options.port
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