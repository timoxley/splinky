var path        = require('path')
  , splinksmvc  = require('../')

splinksmvc({
    port: 7777
  , scan: [
        path.join(__dirname, './controllers')
    ]
  , 'static': {
        path: path.join(__dirname, './static')
      , url: '/'
      , index: 'index.html'
    }
  , 'views': {
        path: path.join(__dirname, './views')
      , suffix: 'swig'
      , processor: 'swig'
    }
}).start()