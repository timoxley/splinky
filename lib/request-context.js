function RequestContext (req, res, params) {
  this.request  = req
  this.response = res
  this.params   = params
  this.model    = {}
}

RequestContext.prototype.setContentType = function (contentType) {
  this.response.statusCode = 200
  this.response.setHeader('content-type', contentType)
}

module.exports = RequestContext