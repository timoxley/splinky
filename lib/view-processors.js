/** toString() view processor **/

module.exports.toStringViewProcessor = function (value, model, callback) {
  callback(null, {
      contentType : 'text/plain'
    , content     : value ? value.toString() : ''
  })
}
module.exports.toStringViewProcessor.$config = {
    id       : 'toStringViewProcessor'
  , category : 'viewProcessor'
}

/** JSON.stringify() view processor **/

module.exports.jsonViewProcessor = function (value, model, callback) {
  try {
    callback(null, {
        contentType : 'application/json'
      , content     : JSON.stringify(value, null, 2)
    })
  } catch (e) {
    callback(String(e))
  }
}
module.exports.jsonViewProcessor.$config = {
    id       : 'jsonViewProcessor'
  , category : 'viewProcessor'
}