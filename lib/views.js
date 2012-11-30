var consolidate = require('consolidate')
  , fs          = require('fs')
  , path        = require('path')

var config = {
        id      : 'viewHandler'
      , type    : 'factory'
      , depends : [ 'options', 'externalSplink' ]
    }

  , viewHandler = function (viewName, model, callback) {
      if (!this.length)
        return callback('No view processor available')

      var i = 0
        , handle = function () {
            var processor = this[i++]
              , file = path.join(processor.path, viewName + '.' + processor.suffix)
            fs.stat(file, function (err, stat) {
              if (!err && stat.isFile())
                return processor.processor(file, model, callback)
              if (i == this.length)
                return callback('Could not locate view [' + viewName + ']')
              handle()
            }.bind(this))
          }.bind(this)

      handle()
    }

  , setupViewHandler = function () {
      var options = this.options['views']
        , ctx     = []
        , handler = viewHandler.bind(ctx)

      options = options ? Array.isArray(options) ? options : [ options ] : []
      options.forEach(
        function (options) {
        var _ctx = {}
        if (options.path && options.suffix && options.processor) {
          _ctx.path = options.path
          _ctx.suffix = options.suffix
          if (typeof options.processor == 'string') {
            _ctx.processor = this.externalSplink.byId(options.processor)
           if (typeof _ctx.processor != 'function')
              _ctx.processor = consolidate[options.processor]
          } else
            _ctx.processor = options.processor
          if (typeof _ctx.processor != 'function')
            throw new Error('No processor function for ' + _ctx.suffix + ' @ ' + _ctx.path)
          ctx.push(_ctx)
        }
      }.bind(this))

      return handler
    }

module.exports = setupViewHandler
module.exports.__meta__ = config