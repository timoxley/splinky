var buster     = require('bustermove')
  , assert     = buster.assert
  , refute     = buster.refute
  , fs         = require('fs')

  , splinksmvc = require('../lib/')
  , hijackSplinkScan  = require('./common').hijackSplinkScan
  , restoreSplinkScan = require('./common').restoreSplinkScan
  , setupServerMocks  = require('./common').setupServerMocks

buster.testCase('Controllers', {
    'setUp': function () {
      setupServerMocks.call(this)
      this.serverMock.expects('listen').once()

      this.createResponseStub = function () {
        return {
            getHeader : this.spy()
          , setHeader : this.spy()
          , write     : this.spy()
          , end       : this.spy()
        }
      }.bind(this)

      this.verifyResponseStub = function (stub, body, call) {
        call = call || 1
        assert.equals(
            stub.getHeader.callCount
          , 3 * call
          , 'res.getHeader() was called thrice'
        )
        assert.equals(
            stub.getHeader.getCall(0).args
          , [ 'content-type' ]
          , 'res.getHeader("content-type") was called'
        )
        assert.equals(
            stub.getHeader.getCall(1).args
          , [ 'content-length' ]
          , 'res.getHeader("content-length") was called'
        )
        assert.equals(
            stub.getHeader.getCall(2).args
          , [ 'content-encoding' ]
          , 'res.getHeader("content-encoding") was called'
        )
        assert.equals(
            stub.end.callCount
          , 1 * call
          , 'res.end() was called'
        )
        assert.equals(
            stub.end.getCall(call - 1).args
          , [ body ]
          , 'res.end() was called with expected body content'
        )
      }
    }

  , 'tearDown': function () {
      restoreSplinkScan()
    }

  , 'single controller for / attaches to router': function (done) {
      var controllerStub = this.stub()
        , resStub        = this.createResponseStub()
        , expectedBody   = 'this is some expected content'
        , ssmvc

      controllerStub.$config = { category: 'controller', route: '/' }
      controllerStub.returns(expectedBody)
      hijackSplinkScan(function (splink) {
        splink.reg(controllerStub)
      })

      ssmvc = splinksmvc(
        { scan: '/foo/bar/', views: { processor: 'toStringViewProcessor' } }
      )
      ssmvc.start(function () {
        var router = ssmvc._splink.byId('router')
          , cbstub = this.stub()

        assert(Array.isArray(router._routes.get))
        assert.equals(router._routes.get.length, 1)
        assert.equals(controllerStub.callCount, 0)
        router.dispatch({ method: 'GET', url: '/foo' }, resStub, cbstub)
        assert.equals(cbstub.callCount, 1)
        assert.equals(controllerStub.callCount, 0)
        router.dispatch({ method: 'GET', url: '/' }, resStub, function () {
          assert(false, 'should not have got callback')
        })
        assert.equals(controllerStub.callCount, 1)
        this.verifyResponseStub(resStub, expectedBody)
        done()
      }.bind(this))
    }

  , 'single controller for /foo attaches to router': function (done) {
      var controllerStub = this.stub()
        , resStub        = this.createResponseStub()
        , expectedBody   = 'this is some expected content'
        , ssmvc

      controllerStub.$config = { category: 'controller', route: '/foo' }
      controllerStub.returns(expectedBody)
      hijackSplinkScan(function (splink) {
        splink.reg(controllerStub)
      })

      ssmvc = splinksmvc(
          { scan: '/foo/bar/', views: { processor: 'toStringViewProcessor' } }
      )
      ssmvc.start(function () {
        var router = ssmvc._splink.byId('router')
          , cbstub = this.stub()

        assert(Array.isArray(router._routes.get))
        assert.equals(router._routes.get.length, 1)
        assert.equals(controllerStub.callCount, 0)
        router.dispatch({ method: 'GET', url: '/' }, resStub, cbstub)
        assert.equals(cbstub.callCount, 1)
        assert.equals(controllerStub.callCount, 0)
        router.dispatch({ method: 'GET', url: '/foo/' }, resStub, function () {
          assert(false, 'should not have got callback')
        })
        assert.equals(controllerStub.callCount, 1)
        this.verifyResponseStub(resStub, expectedBody)
        done()
      }.bind(this))
    }

  , 'single controller for post:/foo attaches to router': function (done) {
      var controllerStub = this.stub()
        , resStub        = this.createResponseStub()
        , expectedBody   = 'this is some expected content'
        , ssmvc

      controllerStub.$config = { category: 'controller', route: '/foo', method: 'post' }
      controllerStub.returns(expectedBody)
      hijackSplinkScan(function (splink) {
        splink.reg(controllerStub)
      })

      ssmvc = splinksmvc(
          { scan: '/foo/bar/', views: { processor: 'toStringViewProcessor' } }
      )
      ssmvc.start(function () {
        var router = ssmvc._splink.byId('router')
          , cbstub = this.stub()

        assert(Array.isArray(router._routes.post))
        assert.equals(router._routes.post.length, 1)
        assert.equals(controllerStub.callCount, 0)
        router.dispatch({ method: 'POST', url: '/' }, resStub, cbstub)
        assert.equals(cbstub.callCount, 1)
        assert.equals(controllerStub.callCount, 0)
        router.dispatch({ method: 'POST', url: '/foo/' }, resStub, function () {
          assert(false, 'should not have got callback')
        })
        assert.equals(controllerStub.callCount, 1)
        this.verifyResponseStub(resStub, expectedBody)
        done()
      }.bind(this))
    }

  , 'single controller for multiple routes attaches to router': function (done) {
      var controllerStub = this.stub()
        , resStub        = this.createResponseStub()
        , expectedBody   = 'this is some expected content'
        , ssmvc

      controllerStub.$config = {
          category: 'controller'
        , route: [ '/foo', '/foo/bar', '/bar' ]
      }
      controllerStub.returns(expectedBody)
      hijackSplinkScan(function (splink) {
        splink.reg(controllerStub)
      })

      ssmvc = splinksmvc(
          { scan: '/foo/bar/', views: { processor: 'toStringViewProcessor' } }
      )
      ssmvc.start(function () {
        var router = ssmvc._splink.byId('router')

        assert(Array.isArray(router._routes.get))
        assert.equals(router._routes.get.length, 3)
        assert.equals(controllerStub.callCount, 0)
        router.dispatch({ method: 'GET', url: '/foo' }, resStub, function () {
          assert(false, 'should not have got callback')
        })
        assert.equals(controllerStub.callCount, 1)
        this.verifyResponseStub(resStub, expectedBody)
        router.dispatch({ method: 'GET', url: '/foo/bar' }, resStub, function () {
          assert(false, 'should not have got callback')
        })
        assert.equals(controllerStub.callCount, 2)
        this.verifyResponseStub(resStub, expectedBody, 2)
        router.dispatch({ method: 'GET', url: '/bar' }, resStub, function () {
          assert(false, 'should not have got callback')
        })
        assert.equals(controllerStub.callCount, 3)
        this.verifyResponseStub(resStub, expectedBody, 3)
        done()
      }.bind(this))
    }

  , 'multiple controllers attach to router': function (done) {
      var controllerStub1 = this.stub()
        , controllerStub2 = this.stub()
        , resStub         = this.createResponseStub()
        , expectedBody1   = 'this is some expected content 1'
        , expectedBody2   = 'this is some expected content 2'
        , ssmvc

      controllerStub1.$config = { category: 'controller', route: '/foo' }
      controllerStub2.$config = { category: 'controller', route: '/bar' }
      controllerStub1.returns(expectedBody1)
      controllerStub2.returns(expectedBody2)
      hijackSplinkScan(function (splink) {
        splink.reg(controllerStub1)
        splink.reg(controllerStub2)
      })

      ssmvc = splinksmvc(
          { scan: '/foo/bar/', views: { processor: 'toStringViewProcessor' } }
      )
      ssmvc.start(function () {
        var router = ssmvc._splink.byId('router')

        assert(Array.isArray(router._routes.get))
        assert.equals(router._routes.get.length, 2)

        assert.equals(controllerStub1.callCount, 0)
        router.dispatch({ method: 'GET', url: '/foo' }, resStub, function () {
          assert(false, 'should not have got callback')
        })
        assert.equals(controllerStub1.callCount, 1)
        this.verifyResponseStub(resStub, expectedBody1)

        assert.equals(controllerStub2.callCount, 0)
        router.dispatch({ method: 'GET', url: '/bar' }, resStub, function () {
          assert(false, 'should not have got callback')
        })
        assert.equals(controllerStub2.callCount, 1)
        this.verifyResponseStub(resStub, expectedBody2, 2)
        done()
      }.bind(this))
    }

  , 'controller is passed correct context': function (done) {
      var controllerStub = this.stub()
        , resStub        = this.createResponseStub()
        , expectedBody   = 'this is some expected content'
        , ctx = { ctx: 'this is the context!' }
        , ssmvc

      controllerStub.$config = { category: 'controller', route: '/:foo/:bar' }
      controllerStub.returns(expectedBody)
      hijackSplinkScan(function (splink) {
        splink.reg(controllerStub)
      })

      ssmvc = splinksmvc(
          { scan: '/foo/bar/', views: { processor: 'toStringViewProcessor' } }
      )
      ssmvc.start(function () {
        var router = ssmvc._splink.byId('router')
          , req    = { method: 'GET', url: '/bing/bang' }

        assert(Array.isArray(router._routes.get))
        assert.equals(router._routes.get.length, 1)
        assert.equals(controllerStub.callCount, 0)
        router.dispatch(req, resStub, function () {
          assert(false, 'should not have got callback')
        })
        assert.equals(controllerStub.callCount, 1)
        this.verifyResponseStub(resStub, expectedBody)
        assert.same(controllerStub.getCall(0).args.length, 1)
        assert.same(controllerStub.getCall(0).args[0].request, req)
        assert.same(controllerStub.getCall(0).args[0].response, resStub)
        assert.equals(controllerStub.getCall(0).args[0].params, { foo: 'bing', bar: 'bang' })
        assert.equals(controllerStub.getCall(0).args[0].model, {})
        done()
      }.bind(this))
    }

  , 'controller can return view': function (done) {
      var controllerStub = this.stub()
        , viewSpy        = this.spy()
        , fsMock         = this.mock(fs)
        , resStub        = this.createResponseStub()
        , ssmvc

      controllerStub.$config = { category: 'controller', route: '/' }
      controllerStub.returns('foobarViewbar')
      hijackSplinkScan(function (splink) {
        splink.reg(controllerStub)
        splink.reg(viewSpy, 'viewSpy')
      })
      fsMock.expects('stat', '/foobarViewbar.swag').callsArgWith(1, null, { isFile: function () { return true } })

      ssmvc = splinksmvc({
          scan: '/foo/bar/'
        , views: {
              path: '/'
            , suffix: 'swag'
            , processor: 'viewSpy'
          }
      })
      ssmvc.start(function () {
        var router = ssmvc._splink.byId('router')

        assert(Array.isArray(router._routes.get))
        assert.equals(router._routes.get.length, 1)
        assert.equals(controllerStub.callCount, 0)
        assert.equals(viewSpy.callCount, 0)
        router.dispatch({ method: 'GET', url: '/' }, resStub, function () {
          assert(false, 'should not have got callback')
        })
        assert.equals(controllerStub.callCount, 1)
        assert.equals(viewSpy.callCount, 1)
        // don't have to verify the resStub, viewSpy doesn't return
        done()
      }.bind(this))
    }
})