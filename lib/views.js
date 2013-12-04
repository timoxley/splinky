module.exports = setupViewManager
module.exports.$config = {
    id      : 'viewManager'
  , type    : 'factory'
  , depends : [ 'options', 'splink', 'externalSplink' ]
}

const consolidate = require('consolidate')
    , fs          = require('fs')
    , path        = require('path')

function viewHandler (viewName, model, callback) {
  if (!this.length)
    return callback(new Error('No view processor available'))

  function noViewProcessor () {
    callback(new Error('No view processor available'))
  }

  var i = 0
    , handle = function () {
        var processor = this[i++]
          , file

        // auto viewprocessor
        if (processor.auto) {
          if (processor.check(viewName))
            return processor.processor(viewName, model, callback)
          if (i == this.length)
            return noViewProcessor()
          return handle()
        }

        // file/template viewprocessor
        if (processor.path) {
          file = processor.path
              && typeof viewName == 'string'
              && path.join(processor.path, viewName + '.' + processor.suffix)

          if (!file) {
            if (i == this.length)
              return noViewProcessor()
            return handle()
          }

          fs.stat(file, function (err, stat) {
            if (!err && stat.isFile())
              return processor.processor(file, model, callback)
            if (i == this.length)
              return callback(new Error('Could not locate view [' + viewName + ']'))
            handle()
          }.bind(this))
        } else {
          // some other kind of viewprocessor
          processor.processor(viewName, model, callback)
        }
      }.bind(this)

  handle()
}

function setupProcessor (processors, processorOptions) {
  if (processorOptions.processor) {
    var ctx = { auto: false }

    if (processorOptions.path != null)
      ctx.path = processorOptions.path

    if (processorOptions.suffix != null)
      ctx.suffix = processorOptions.suffix

    if (typeof processorOptions.processor == 'string') { // a Splink id
      ctx.processor = this.externalSplink.byId(processorOptions.processor)
      if (typeof ctx.processor != 'function')
        ctx.processor = consolidate[processorOptions.processor]
    } else {
      ctx.processor = processorOptions.processor
    }

    if (typeof ctx.processor != 'function')
      throw new Error('No processor function for ' + ctx.suffix + ' @ ' + ctx.path) // TODO: nothrow?
    processors.push(ctx)
  }
}

function setupViewManager () {
  var processors = []

  // register any internal view processors to the external Splink
  this.splink.keysByCategory('viewProcessor').forEach(function (key) {
    if (!this.externalSplink.meta(key)) // isn't already there
      this.externalSplink.reg(this.splink.byId(key), key)
  }.bind(this))

  // find any auto view processors and put them at the head of the list
  this.externalSplink.keysByCategory('viewProcessor').forEach(function (key) {
    var meta = this.externalSplink.meta(key)
      , processor

    if (meta.auto !== true)
      return

    processor = this.externalSplink.byId(key)

    if (typeof processor != 'function' || typeof processor.check != 'function')
      return

    processors.push({ auto: true, check: processor.check, processor: processor })
  }.bind(this))

  if (this.options.views) {
    if (Array.isArray(this.options.views)) {
      this.options.views.forEach(function (viewProcessor) {
        setupProcessor.call(this, processors, viewProcessor)
      }.bind(this))
    } else {
      setupProcessor.call(this, processors, this.options.views)
    }
  }

  return function (controllerProcessors) {
    var _processors = Object.create(processors)
    if (!Array.isArray(controllerProcessors))
      controllerProcessors = controllerProcessors ? [ controllerProcessors ] : []
  
    controllerProcessors.forEach(function (options) {
      if (typeof options == 'string' || typeof options == 'function')
        options = { processor: options }
      setupProcessor.call(this, _processors, options)
    }.bind(this))

    return viewHandler.bind(_processors)
  }.bind(this)
}