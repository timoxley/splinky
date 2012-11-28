var config = {
        category: 'controller'
      , route: '/'
    }

  , handler = function () {
      console.log('root handler!')
      this.res.end('ROOT!')
    }

module.exports = handler
module.exports.__meta__ = config