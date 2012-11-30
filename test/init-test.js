var buster     = require('buster')
  , assert     = buster.assert

  , splinksmvc = require('../lib/')
  , hijackSplinkScan  = require('./common').hijackSplinkScan
  , restoreSplinkScan = require('./common').restoreSplinkScan
  , setupServerMocks  = require('./common').setupServerMocks

buster.testCase('Init', {
    'start()': {
        'test listen': function () {
          var httpMock = this.mock(require('http'))
            , server = { listen: function () {} }
            , serverMock = this.mock(server)
          httpMock.expects('createServer').once().returns(server)
          serverMock.expects('listen').once().withExactArgs(80)
          splinksmvc({}).start()
        }

      , 'test listen, custom port in options': function () {
          var httpMock = this.mock(require('http'))
            , server = { listen: function () {} }
            , serverMock = this.mock(server)
          httpMock.expects('createServer').once().returns(server)
          serverMock.expects('listen').once().withExactArgs(8080)
          splinksmvc({ port: 8080 }).start()
        }

      , 'test listen, custom port in start() argument': function () {
          var httpMock = this.mock(require('http'))
            , server = { listen: function () {} }
            , serverMock = this.mock(server)
          httpMock.expects('createServer').once().returns(server)
          serverMock.expects('listen').once().withExactArgs(8888)
          splinksmvc({ }).start(8888)
        }
    }

  , 'scan option': {
        'setUp': function () {
          var scanPaths = this.scanPaths = []
          hijackSplinkScan(function (splink, path) {
            scanPaths.push(path)
          })
        }

      , 'tearDown': restoreSplinkScan

      , 'test scan argument': function () {
          splinksmvc({})
          assert.equals(this.scanPaths, [])
        }

      , 'test single path string': function () {
          splinksmvc({ scan: '/foo/bar/' })
          assert.equals(this.scanPaths, [ '/foo/bar/' ])
        }

      , 'test multiple path strings': function () {
          splinksmvc({ scan: [ '/foo/bar/', '/bang.js', '/ping/pong/pang' ] })
          assert.equals(this.scanPaths, [ '/foo/bar/', '/bang.js', '/ping/pong/pang' ])
        }
    }
})