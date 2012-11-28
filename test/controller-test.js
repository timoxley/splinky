var buster     = require('buster')
  , assert     = buster.assert
  , director   = require('director')
  , fs         = require('fs')

  , splinksmvc = require('../lib/')
  , hijackSplinkScan  = require('./common').hijackSplinkScan
  , restoreSplinkScan = require('./common').restoreSplinkScan

buster.testCase('Controllers', {
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
      restoreSplinkScan()
      director.http.Router = this.RouterOrig
    }

  , 'single controller for / attaches to router': function () {
      var spy = this.spy()
        , ssmvc

      spy.__meta__ = { category: 'controller', route: '/' }
      hijackSplinkScan(function (splink) {
        splink.reg(spy)
      })

      ssmvc = splinksmvc({ scan: '/foo/bar/' })

      assert.equals(typeof this.router.routes.get, 'function')
      assert.equals(spy.callCount, 0)
      this.router.routes.get()
      assert.equals(spy.callCount, 1)
    }

  , 'single controller for /foo attaches to router': function () {
      var spy = this.spy()
        , ssmvc

      spy.__meta__ = { category: 'controller', route: '/foo' }
      hijackSplinkScan(function (splink) {
        splink.reg(spy)
      })

      ssmvc = splinksmvc({ scan: '/foo/bar/' })

      assert.equals(typeof this.router.routes.foo.get, 'function')
      assert.equals(spy.callCount, 0)
      this.router.routes.foo.get()
      assert.equals(spy.callCount, 1)
    }

  , 'single controller for post:/foo attaches to router': function () {
      var spy = this.spy()
        , ssmvc

      spy.__meta__ = { category: 'controller', route: '/foo', method: 'post' }
      hijackSplinkScan(function (splink) {
        splink.reg(spy)
      })

      ssmvc = splinksmvc({ scan: '/foo/bar/' })

      assert.equals(typeof this.router.routes.foo.post, 'function')
      assert.equals(spy.callCount, 0)
      this.router.routes.foo.post()
      assert.equals(spy.callCount, 1)
    }

  , 'single controller for multiple routes attaches to router': function () {
      var spy = this.spy()
        , ssmvc

      spy.__meta__ = { category: 'controller', route: [ '/foo', '/foo/bar', '/bar' ] }
      hijackSplinkScan(function (splink) {
        splink.reg(spy)
      })

      ssmvc = splinksmvc({ scan: '/foo/bar/' })

      assert.equals(spy.callCount, 0)

      assert.equals(typeof this.router.routes.foo.get, 'function')
      this.router.routes.foo.get()
      assert.equals(spy.callCount, 1)

      assert.equals(typeof this.router.routes.foo.bar.get, 'function')
      this.router.routes.foo.bar.get()
      assert.equals(spy.callCount, 2)

      assert.equals(typeof this.router.routes.bar.get, 'function')
      this.router.routes.bar.get()
      assert.equals(spy.callCount, 3)
    }

  , 'multiple controllers attach to router': function () {
      var spy1 = this.spy()
        , spy2 = this.spy()
        , ssmvc

      spy1.__meta__ = { category: 'controller', route: '/foo' }
      spy2.__meta__ = { category: 'controller', route: '/bar' }
      hijackSplinkScan(function (splink) {
        splink.reg(spy1)
        splink.reg(spy2)
      })

      ssmvc = splinksmvc({ scan: '/foo/bar/' })

      assert.equals(typeof this.router.routes.foo.get, 'function')
      assert.equals(spy1.callCount, 0)
      this.router.routes.foo.get()
      assert.equals(spy1.callCount, 1)

      assert.equals(typeof this.router.routes.bar.get, 'function')
      assert.equals(spy2.callCount, 0)
      this.router.routes.bar.get()
      assert.equals(spy2.callCount, 1)
    }

  , 'controller is passed correct context': function () {
      var spy = this.spy()
        , ssmvc
        , ctx = { ctx: 'this is the context!' }

      spy.__meta__ = { category: 'controller', route: '/' }
      hijackSplinkScan(function (splink) {
        splink.reg(spy)
      })

      ssmvc = splinksmvc({ scan: '/foo/bar/' })

      assert.equals(typeof this.router.routes.get, 'function')
      assert.equals(spy.callCount, 0)
      this.router.routes.get.call(ctx)
      assert.equals(spy.callCount, 1)

      // the trick here is that we don't care whether it's the exact context or
      // the context is in the prototype chain, as long as its properties are available
      // so comparing thisValue to ctx is too strict
      assert.same(spy.getCall(0).thisValue.ctx, ctx.ctx)
    }

  , 'controller can return view': function () {
      var controllerStub = this.stub()
        , viewSpy = this.spy()
        , fsMock = this.mock(fs)
        , ssmvc
        , ctx = { ctx: 'this is the context!' }

      hijackSplinkScan(function (splink) {
        splink.reg(controllerStub, { category: 'controller', route: '/' })
        splink.reg(viewSpy, 'viewSpy')
      })

      ssmvc = splinksmvc({
          scan: '/foo/bar/'
        , views: {
              path: '/'
            , suffix: 'swag'
            , processor: 'viewSpy'
          }
      })

      controllerStub.returns('foobarViewbar')
      fsMock.expects('stat', '/foobarViewbar.swag').callsArgWith(1, null, { isFile: function () { return true } })

      assert.equals(controllerStub.callCount, 0)
      assert.equals(viewSpy.callCount, 0)
      this.router.routes.get.call(ctx)
      assert.equals(controllerStub.callCount, 1)
      assert.equals(viewSpy.callCount, 1)
    }
})