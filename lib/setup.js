module.exports = scan
module.exports.$config = {
    id        : 'setup'
  , depends   : [ 'options', 'externalSplink' ]
}

function scan () {
  var scanPaths = this.options.scan
  if (scanPaths)
    (Array.isArray(scanPaths) ? scanPaths : [ scanPaths ])
      .forEach(this.externalSplink.scanPathSync.bind(this.externalSplink))
}