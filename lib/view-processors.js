var toStringViewProcessor = function (value, model, callback) {
      callback(null, value ? value.toString() : '')
    }

toStringViewProcessor.__meta__ = {
    id       : 'toStringViewProcessor'
  , category : 'viewProcessor'
}

var jsonViewProcessor = function (value, model, callback) {
      try {
        callback(null, JSON.stringify(value, null, 2))
      } catch (e) {
        callback(e)
      }
    }

jsonViewProcessor.__meta__ = {
    id       : 'jsonViewProcessor'
  , category : 'viewProcessor'
}

module.exports = {
    toStringViewProcessor : toStringViewProcessor
  , jsonViewProcessor     : jsonViewProcessor
}