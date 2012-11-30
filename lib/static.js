var config = {
        id      : 'static'
      , type    : 'factory'
      , depends : [ 'options' ]
    }

  , setupStatic = function () {
      if (this.options && this.options.static) {
        var st = require('st')
          , mount = st(this.options.static)
        return mount
      }
      return null
    }

module.exports = setupStatic
module.exports.__meta__ = config