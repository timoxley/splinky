var toStringViewProcessor = function (value, model, callback) {
      callback(null, {
          contentType : 'text/plain'
        , content     : value ? value.toString() : ''
      })
    }

toStringViewProcessor.$config = {
    id       : 'toStringViewProcessor'
  , category : 'viewProcessor'
}

var jsonViewProcessor = function (value, model, callback) {
      try {
        callback(null, {
            contentType : 'application/json'
          , content     : JSON.stringify(value, null, 2)
        })
      } catch (e) {
        callback(String(e))
      }
    }

jsonViewProcessor.$config = {
    id       : 'jsonViewProcessor'
  , category : 'viewProcessor'
}

module.exports = {
    toStringViewProcessor : toStringViewProcessor
  , jsonViewProcessor     : jsonViewProcessor
}