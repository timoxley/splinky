var buster   = require('bustermove')
  , assert   = buster.assert
  , refute   = buster.refute
  , path     = require('path')

  , splinksmvc = require('../lib/')

buster.testCase('Static', {
    'setUp': function () {
      this.stOrig = require('st')
      this.replaceSt = function (st) {
        require.cache[path.join(__dirname, '../node_modules/st/st.js')].exports = st
      }
    }

  , 'tearDown': function () {
      require.cache[path.join(__dirname, '../node_modules/st/st.js')].exports = this.stOrig
    }

  , 'test no static': function () {
      var spy = this.spy()
      this.replaceSt(spy)
      splinksmvc({}).init()._splink.byId('server')
      assert.equals(spy.callCount, 0)
    }

  , 'test static path string': function () {
      var stub = this.stub()
        , mount = { mount: 1 }

      stub.returns(mount)
      this.replaceSt(stub)

      splinksmvc({ 'static': '/foo/bar/' }).init()._splink.byId('server')

      assert.equals(stub.callCount, 1)
      assert.equals(stub.getCall(0).args, [ '/foo/bar/' ])
    }

  , 'test static with full st config': function () {
      var stub = this.stub()
        , mount = { mount: 1 }
        , config = { config: 1 }

      stub.returns(mount)
      this.replaceSt(stub)

      splinksmvc({ 'static': config }).init()._splink.byId('server')

      assert.equals(stub.callCount, 1)
      assert.equals(stub.getCall(0).args.length, 1)
      assert.same(stub.getCall(0).args[0], config)
    }


  , 'test multiple static mounts string': function () {
      var stub = this.stub()
        , mount = { mount: 1 }
        , config = { config: 1 }

      stub.returns(mount)
      this.replaceSt(stub)

      splinksmvc({ 'static':  [ '/foo/bar/', '/baz/bang/', config ] })
        .init()._splink.byId('server')

      assert.equals(stub.callCount, 3)
      assert.equals(stub.getCall(0).args, [ '/foo/bar/' ])
      assert.equals(stub.getCall(1).args, [ '/baz/bang/' ])
      assert.same(stub.getCall(2).args[0], config)
    }

  , 'test static used for http requests': {
      'setUp': function () {
      }

    , 'tearDown': function () {
      }

    , 'exec return true': function (done) {
        var httpMock = this.mock(require('http'))
          , server = { }
          , stub = this.stub()
          , mount = this.stub()
          , config = { config: 1 }
          , expectation
          , handler
          , req = { method: 'get', on: function () {} }
          , res = { setHeader: function () {}, writeHead: function () {}, end: this.spy() }

        expectation = httpMock.expects('createServer').once().returns(server)
        stub.returns(mount)
        this.replaceSt(stub)
        mount.callsArg(2) // static resource not found

        splinksmvc({ 'static': config }).init()._splink.byId('server')

        handler = expectation.getCall(0).args[0]

        assert.equals(mount.callCount, 0)
        assert.equals(res.end.callCount, 0)
        handler(req, res)
        process.nextTick(function () {
          assert.equals(mount.callCount, 1)
          assert.equals(res.end.callCount, 1) // should move on from static
          done()
        })
      }

    , 'exec return false': function (done) {
        var httpMock = this.mock(require('http'))
          , server = { }
          , stub = this.stub()
          , mount = this.stub()
          , config = { config: 1 }
          , expectation
          , handler
          , req = { method: 'get', on: function () {} }
          , res = { setHeader: function () {}, writeHead: function () {}, end: this.spy() }

        expectation = httpMock.expects('createServer').once().returns(server)
        stub.returns(mount)
        this.replaceSt(stub)

        splinksmvc({ 'static': config }).init()._splink.byId('server')

        handler = expectation.getCall(0).args[0]

        assert.equals(mount.callCount, 0)
        assert.equals(res.end.callCount, 0)
        handler(req, res)
        process.nextTick(function () {
          assert.equals(mount.callCount, 1)
          assert.equals(res.end.callCount, 0) // should NOT move on from static
          done()
        })
      }

    , 'multiple mount points': function (done) {
        var httpMock = this.mock(require('http'))
          , server = { }
          , stub = this.stub()
          , mount1 = this.stub()
          , mount2 = this.stub()
          , mount3 = this.stub()
          , config1 = { config: 1 }
          , config2 = { config: 2 }
          , config3 = { config: 3 }
          , expectation
          , handler
          , req = { method: 'get', on: function () {} }
          , res = { setHeader: function () {}, writeHead: function () {}, end: this.spy() }

        expectation = httpMock.expects('createServer').once().returns(server)
        stub.withArgs(config1).returns(mount1)
        stub.withArgs(config2).returns(mount2)
        stub.withArgs(config3).returns(mount3)
        this.replaceSt(stub)
        mount1.callsArg(2) // static not resource found
        mount2.callsArg(2) // static not resource found

        splinksmvc({ 'static': [ config1, config2, config3 ] })
          .init()._splink.byId('server')

        handler = expectation.getCall(0).args[0]

        assert.equals(mount1.callCount, 0)
        assert.equals(mount2.callCount, 0)
        assert.equals(mount3.callCount, 0)
        assert.equals(res.end.callCount, 0)
        handler(req, res)
        process.nextTick(function () {
          assert.equals(mount1.callCount, 1)
          assert.equals(mount2.callCount, 1)
          assert.equals(mount3.callCount, 1)
          assert.equals(res.end.callCount, 0) // should NOT move on from static
          done()
        })
      }
  }
})