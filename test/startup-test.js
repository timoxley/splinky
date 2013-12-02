var buster  = require('bustermove')
  , assert  = buster.assert
  , refute  = buster.refute
  , Splinky = require('../')

buster.testCase('Startup', {
    'test startup component triggered on server start': function (done) {
      var port       = 1024 + Math.ceil(10000 * Math.random())
        , splinky    = Splinky({ port: port })
        , startupSpy = this.spy()
      startupSpy.$config = { category: 'startup' }
      splinky.reg(startupSpy)
      splinky.listen(function (err, httpServer) {
        assert.equals(httpServer && typeof httpServer.getConnections, 'function', 'returned http server on callback')
        splinky.splink.byId('httpServer').close()
        assert.equals(startupSpy.callCount, 1, 'startupSpy was called')
        assert.same(startupSpy.getCall(0).args[0], httpServer, 'startupSpy called with httpServer')
        done()
      })
    }
})