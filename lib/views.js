var consolidate = require('consolidate')
  , fs          = require('fs')
  , path        = require('path')

var config = {
        id      : 'viewManager'
      , type    : 'factory'
      , depends : [ 'options', 'splink', 'externalSplink' ]
    }

  , viewHandler = function (viewName, model, callback) {
      if (!this.length)
        return callback('No view processor available')

      var i = 0
        , handle = function () {
            var processor = this[i++]
              , file = processor.path && path.join(processor.path, viewName + '.' + processor.suffix)

            if (file) {
              fs.stat(file, function (err, stat) {
                if (!err && stat.isFile())
                  return processor.processor(file, model, callback)
                if (i == this.length)
                  return callback('Could not locate view [' + viewName + ']')
                handle()
              }.bind(this))
            } else
              processor.processor(viewName, model, callback)
          }.bind(this)

      handle()
    }

  , setupProcessor = function (processors, processorOptions) {
      if (processorOptions.processor) {
        var ctx = {}
        if (processorOptions.path != null) ctx.path = processorOptions.path
        if (processorOptions.suffix != null) ctx.suffix = processorOptions.suffix
        if (typeof processorOptions.processor == 'string') { // a Splink id
          ctx.processor = this.externalSplink.byId(processorOptions.processor)
          if (typeof ctx.processor != 'function')
            ctx.processor = consolidate[processorOptions.processor]
        } else
          ctx.processor = processorOptions.processor
        if (typeof ctx.processor != 'function')
          throw new Error('No processor function for ' + ctx.suffix + ' @ ' + ctx.path)
        processors.push(ctx)
      }
    }

  , setupViewManager = function () {
      var options    = this.options['views']
        , processors = []

      // register any internal view processors to the external Splink
      this.splink.keysByCategory('viewProcessor').forEach(function (key) {
        if (!this.externalSplink.meta(key)) // isn't already there
          this.externalSplink.reg(this.splink.byId(key), key)
      }.bind(this))

      options = options ? Array.isArray(options) ? options : [ options ] : []
      options.forEach(function (options) {
        setupProcessor.call(this, processors, options)
      }.bind(this))

      return function (controllerProcessors) {
        var _processors = Object.create(processors)
        if (!Array.isArray(controllerProcessors))
          controllerProcessors = controllerProcessors ? [ controllerProcessors ] : []
      
        controllerProcessors.forEach(function (options) {
          setupProcessor.call(this, _processors, options)
        }.bind(this))

        return viewHandler.bind(_processors)
      }.bind(this)
    }

module.exports = setupViewManager
module.exports.__meta__ = config