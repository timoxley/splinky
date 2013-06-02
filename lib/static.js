var config = {
        id      : 'static'
      , type    : 'factory'
      , depends : [ 'options' ]
    }

  , setupStatic = function () {
      if (this.options && this.options.static) {
        var st      = require('st')
          , configs = Array.isArray(this.options.static)
                ? this.options.static
                : [ this.options.static ]

        return configs.map(function (config) { return st(config) })
      }
      return []
    }

module.exports = setupStatic
module.exports.$config = config