/** toString() view processor **/

module.exports.redirectViewProcessor = function (value, model, callback) {
  callback(null, function (req, res) {
    res.writeHead(
        typeof value.code == 'number' ? value.code : 303
      , { 'location': value.url }
    )
    res.end()
  })
}
module.exports.redirectViewProcessor.check = function (value) {
  return typeof value == 'object'
    && value.redirect === true
    && typeof value.url == 'string'
}
module.exports.redirectViewProcessor.$config = {
    id       : 'redirectViewProcessor'
  , category : 'viewProcessor'
  , auto     : true
}