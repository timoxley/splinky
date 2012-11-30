var buster     = require('buster')
  , assert     = buster.assert
  , path       = require('path')
  , director   = require('director')

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
      splinksmvc({})._splink.byId('server')
      assert.equals(spy.callCount, 0)
    }

  , 'test static path string': function () {
      var stub = this.stub()
        , mount = { mount: 1 }

      stub.returns(mount)
      this.replaceSt(stub)

      splinksmvc({ 'static': '/foo/bar/' })._splink.byId('server')

      assert.equals(stub.callCount, 1)
      assert.equals(stub.getCall(0).args, [ '/foo/bar/' ])
    }

  , 'test static with full st config': function () {
      var stub = this.stub()
        , mount = { mount: 1 }
        , config = { config: 1 }

      stub.returns(mount)
      this.replaceSt(stub)

      splinksmvc({ 'static': config })._splink.byId('server')

      assert.equals(stub.callCount, 1)
      assert.equals(stub.getCall(0).args.length, 1)
      assert.same(stub.getCall(0).args[0], config)
    }

  , 'test static used for http requests': {
      'setUp': function () {
        var RouterOrig = this.RouterOrig = director.http.Router
          , setRouter = function (r) {
              this.router = r
            }.bind(this)
        director.http.Router = function () {
          setRouter(this)
          return RouterOrig.apply(this, arguments)
        }
        director.http.Router.prototype = RouterOrig.prototype
      }

    , 'tearDown': function () {
        director.http.Router = this.RouterOrig
      }

    , 'exec return true': function () {
        var httpMock = this.mock(require('http'))
          , server = { }
          , stub = this.stub()
          , mount = this.stub()
          , config = { config: 1 }
          , expectation
          , handler
          , req = { method: 'get' }
          , res = { writeHead: function () {}, end: this.spy() }

        expectation = httpMock.expects('createServer').once().returns(server)
        stub.returns(mount)
        this.replaceSt(stub)
        mount.returns(false) // static resource not found

        splinksmvc({ 'static': config })._splink.byId('server')

        handler = expectation.getCall(0).args[0]

        assert.equals(mount.callCount, 0)
        assert.equals(res.end.callCount, 0)
        handler(req, res)
        assert.equals(mount.callCount, 1)
        assert.equals(res.end.callCount, 1) // should move on from static
      }

    , 'exec return false': function () {
        var httpMock = this.mock(require('http'))
          , server = { }
          , stub = this.stub()
          , mount = this.stub()
          , config = { config: 1 }
          , expectation
          , handler
          , req = { method: 'get' }
          , res = { writeHead: function () {}, end: this.spy() }

        expectation = httpMock.expects('createServer').once().returns(server)
        stub.returns(mount)
        this.replaceSt(stub)
        mount.returns(true) // static resource found

        splinksmvc({ 'static': config })._splink.byId('server')

        handler = expectation.getCall(0).args[0]

        assert.equals(mount.callCount, 0)
        assert.equals(res.end.callCount, 0)
        handler(req, res)
        assert.equals(mount.callCount, 1)
        assert.equals(res.end.callCount, 0) // should NOT move on from static
      }
  }
})