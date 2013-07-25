module.exports = setupStatic
module.exports.$config = {
    id      : 'static'
  , type    : 'factory'
  , depends : [ 'options' ]
}

function setupStatic () {
  if (this.options && this.options.static) {
    var st      = require('st')
      , configs = Array.isArray(this.options.static)
            ? this.options.static
            : [ this.options.static ]

    return configs.map(function (config) { return st(config) })
  }
  return []
}