var Splink     = require('splink')
  , path       = require('path')

module.exports.hijackSplinkScan = function (cb) {
  var ssmvcPathRe = new RegExp('^' + path.join(__dirname, '../lib').replace(/\//g, '\\/'))

  Splink.prototype._scanPathSync = Splink.prototype.scanPathSync
  Splink.prototype.scanPathSync = function (path) {
    if (ssmvcPathRe.test(path)) // let internal splink-smvc calls through
      return this._scanPathSync.apply(this, arguments)
    cb(this, path)
  }
}

module.exports.restoreSplinkScan = function () {
  if (Splink.prototype._scanPathSync)
    Splink.prototype.scanPathSync = Splink.prototype._scanPathSync
}

