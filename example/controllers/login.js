var config = {
        category: 'controller'
      , route: '/login'
    }

  , handler = function () {
      console.log('login handler!')
      this.res.end('LOGIN!')
    }

module.exports = handler
module.exports.__meta__ = config