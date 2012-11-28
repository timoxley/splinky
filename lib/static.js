var config = {
        id       : 'static'
      , category : 'init'
      , depends  : [ 'options', 'splink' ]
    }

  , setupStatic = function () {
      if (!!this.options['static']) {
        var st = require('st')
          , mount = st(this.options['static'])

        this.splink.reg(mount, 'st')
      }
    }

module.exports = setupStatic
module.exports.__meta__ = config