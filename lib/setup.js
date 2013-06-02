var config = {
        id        : 'setup'
      , depends   : [ 'options', 'externalSplink' ]
    }

  , scan = function () {
      var scanPaths = this.options.scan
      if (scanPaths)
        (Array.isArray(scanPaths) ? scanPaths : [ scanPaths ])
          .forEach(this.externalSplink.scanPathSync.bind(this.externalSplink))
    }

module.exports = scan
module.exports.$config = config