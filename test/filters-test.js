var buster     = require('buster')
  , assert     = buster.assert
  , director   = require('director')
  , extend     = require('util')._extend

  , splinksmvc = require('../lib/')
  , hijackSplinkScan  = require('./common').hijackSplinkScan
  , restoreSplinkScan = require('./common').restoreSplinkScan
  , setupServerMocks  = require('./common').setupServerMocks

buster.testCase('Filters', {
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

      setupServerMocks.call(this)
      this.serverMock.expects('listen').once()

      this.registerController = function (config, controller, callback) {
        controller.__meta__ = extend({ category: 'controller', route: '/' }, config)
        hijackSplinkScan(function (splink) {
          splink.reg(controller)
          callback && callback(null, splink)
        })
      }

      this.executeController = function (config, route, callback) {
        if (typeof route == 'function') {
          callback = route
          route = null
        }

        splinksmvc(extend({ scan: '/foo/bar/' }, config)).start(function () {
          var r = this.router.routes
          if (route) r = r[route]
          r = r.get
          assert.equals(typeof r, 'function')
          r()
          callback()
        }.bind(this))
      }
    }

  , 'tearDown': function () {
      restoreSplinkScan()
      director.http.Router = this.RouterOrig
    }

  , 'single filter is used': function (done) {
      var filter     = this.stub()
        , config     = { filters: [ filter ] }
        , controller = this.spy()

      filter.callsArg(2)

      this.registerController({}, controller)
      this.executeController(config, function () {
        assert.equals(controller.callCount, 1)
        assert.equals(filter.callCount, 1)
        done()
      }.bind(this))
    }

  , 'multiple filters are used': function (done) {
      var filter1    = this.stub()
        , filter2    = this.stub()
        , filter3    = this.stub()
        , config     = { filters: [ filter1, filter2, filter3 ] }
        , controller = this.spy()

      filter1.callsArg(2)
      filter2.callsArg(2)
      filter3.callsArg(2)

      this.registerController({}, controller)
      this.executeController(config, function () {
        assert.equals(controller.callCount, 1)
        assert.equals(filter1.callCount, 1)
        assert.equals(filter2.callCount, 1)
        assert.equals(filter3.callCount, 1)
        done()
      }.bind(this))
    }

  , 'multiple stacked filters': function (done) {
      var filter1    = this.stub()
        , filter2    = this.stub()
        , filter3    = this.stub()
        , config     = { filters: [ filter1, [ filter2, filter3 ] ] }
        , controller = this.spy()

      filter1.callsArg(2)
      filter2.callsArg(2)
      filter3.callsArg(2)

      this.registerController({}, controller)
      this.executeController(config, function () {
        assert.equals(controller.callCount, 1)
        assert.equals(filter1.callCount, 1)
        assert.equals(filter2.callCount, 1)
        assert.equals(filter3.callCount, 1)
        done()
      }.bind(this))
    }

  , 'global filters + controller-specific filters': function (done) {
      var filter1    = this.stub()
        , filter2    = this.stub()
        , filter3    = this.stub()
        , config     = { filters: [ filter1 ] }
        , controller1 = this.spy()
        , controller2 = this.spy()

      filter1.callsArg(2)
      filter2.callsArg(2)
      filter3.callsArg(2)

      // we're going to run these twice so do an extra expects() beyond the ones already set up
      this.httpMock.expects('createServer').once().returns(this.server)
      this.serverMock.expects('listen').once()

      // set these up here because registerController() only does one and we can't
      // call it twice
      controller1.__meta__ = { category: 'controller', route: '/' }
      controller2.__meta__ = { category: 'controller', route: '/foo', filters: [ filter2, filter3 ] }
      hijackSplinkScan(function (splink) {
        splink.reg(controller1)
        splink.reg(controller2)
      })

      this.executeController(config, function () {
        assert.equals(controller1.callCount, 1)
        assert.equals(controller2.callCount, 0)
        assert.equals(filter1.callCount, 1)
        assert.equals(filter2.callCount, 0)
        assert.equals(filter3.callCount, 0)

        this.executeController(config, 'foo', function () {
          assert.equals(controller1.callCount, 1)
          assert.equals(controller2.callCount, 1)
          assert.equals(filter1.callCount, 2)
          assert.equals(filter2.callCount, 1)
          assert.equals(filter3.callCount, 1)

          done()
        }.bind(this))
      }.bind(this))
    }

  , 'single filter from splink scan': function (done) {
      var filter     = this.stub()
        , controller = this.spy()

      filter.callsArg(2)

      this.registerController({}, controller, function (err, splink) {
        splink.reg(filter, { category: 'filter' })
      })
      this.executeController({}, function () {
        assert.equals(controller.callCount, 1)
        assert.equals(filter.callCount, 1)
        done()
      }.bind(this))
    }

  , 'multiple filters from splink scan': function (done) {
      var filter1    = this.stub()
        , filter2    = this.stub()
        , filter3    = this.stub()
        , controller = this.spy()

      filter1.callsArg(2)
      filter2.callsArg(2)
      filter3.callsArg(2)

      this.registerController({}, controller, function (err, splink) {
        splink.reg(filter1, { category: 'filter' })
        splink.reg(filter2, { category: 'filter' })
        splink.reg(filter3, { category: 'filter' })
      })
      this.executeController({}, function () {
        assert.equals(controller.callCount, 1)
        assert.equals(filter1.callCount, 1)
        assert.equals(filter2.callCount, 1)
        assert.equals(filter3.callCount, 1)
        done()
      }.bind(this))
    }

  , 'global filter ordering from config': function (done) {
      var calls      = []
        , mkfilter   = function (id) {
            return function (req, res, next) {
              calls.push(id)
              // also tests async filters
              process.nextTick(next)
            }
          }
        , filter1    = mkfilter('one')
        , filter2    = mkfilter('two')
        , filter3    = mkfilter('three')
        , config     = { filters: [ filter1, filter2, filter3 ] }
        , controller = this.spy()

      this.registerController({}, controller)
      this.executeController(config, function () {
        setTimeout(function () { // unfortunate hack, need a better way of intercepting the controller call
          assert.equals(controller.callCount, 1)
          assert.equals(calls, [ 'one', 'two', 'three' ])
          done()
        }, 10)
      }.bind(this))
    }

  , 'global filter ordering from scan': function (done) {
      var calls      = []
        , mkfilter   = function (id) {
            return function (req, res, next) {
              calls.push(id)
              // also tests async filters
              process.nextTick(next)
            }
          }
        , filter1    = mkfilter('one')
        , filter2    = mkfilter('two')
        , filter3    = mkfilter('three')
        , controller = this.spy()

      this.registerController({}, controller, function (err, splink) {
        // register shuffled
        splink.reg(filter3, { category: 'filter', id: 'filter03' })
        splink.reg(filter1, { category: 'filter', id: 'filter01' })
        splink.reg(filter2, { category: 'filter', id: 'filter02' })
      })

      this.executeController({}, function () {
        setTimeout(function () { // unfortunate hack, need a better way of intercepting the controller call
          assert.equals(controller.callCount, 1)
          assert.equals(calls, [ 'one', 'two', 'three' ])
          done()
        }, 10)
      }.bind(this))
    }

  , 'global filter ordering from config & scan': function (done) {
      var calls      = []
        , mkfilter   = function (id) {
            return function (req, res, next) {
              calls.push(id)
              // also tests async filters
              process.nextTick(next)
            }
          }
        , filter1    = mkfilter('one')
        , filter2    = mkfilter('two')
        , filter3    = mkfilter('three')
        , controller = this.spy()

      filter2.__meta__ = { id: 'filter02' }

      this.registerController({}, controller, function (err, splink) {
        // register shuffled
        splink.reg(filter3, { category: 'filter', id: 'filter03' })
        splink.reg(filter1, { category: 'filter', id: 'filter01' })
      })

      this.executeController({ filters: [ filter2 ] }, function () {
        setTimeout(function () { // unfortunate hack, need a better way of intercepting the controller call
          assert.equals(controller.callCount, 1)
          // first 'two' from config, then 'one' and 'three' from scan
          assert.equals(calls, [ 'two', 'one', 'three' ])
          done()
        }, 10)
      }.bind(this))
    }

  , 'global filter ordering from config & scan & controller': function (done) {
      var calls      = []
        , mkfilter   = function (id) {
            return function (req, res, next) {
              calls.push(id)
              // also tests async filters
              process.nextTick(next)
            }
          }
        , filter1    = mkfilter('one')
        , filter2    = mkfilter('two')
        , filter3    = mkfilter('three')
        , filter4    = mkfilter('four')
        , controller = this.spy()

      this.registerController({ filters: [ filter4 ]}, controller, function (err, splink) {
        // register shuffled
        splink.reg(filter3, { category: 'filter', id: 'filter03' })
        splink.reg(filter1, { category: 'filter', id: 'filter01' })
      })

      this.executeController({ filters: [ filter2 ] }, function () {
        setTimeout(function () { // unfortunate hack, need a better way of intercepting the controller call
          assert.equals(controller.callCount, 1)
          // first 'two' from global, then 'one' and 'four' from scan, then 'two' from controller
          assert.equals(calls, [ 'two', 'one', 'three', 'four' ])
          done()
        }, 10)
      }.bind(this))
    }

  , 'global filter ordering from config & scan & controller, all from splink ids': function (done) {
      var calls      = []
        , mkfilter   = function (id) {
            return function (req, res, next) {
              calls.push(id)
              // also tests async filters
              process.nextTick(next)
            }
          }
        , filter1    = mkfilter('one')
        , filter2    = mkfilter('two')
        , filter3    = mkfilter('three')
        , filter4    = mkfilter('four')
        , controller = this.spy()

      this.registerController({ filters: [ 'filter04' ]}, controller, function (err, splink) {
        // register shuffled
        splink.reg(filter2, { id: 'filter02' })
        splink.reg(filter4, { id: 'filter04' })
        splink.reg(filter3, { category: 'filter', id: 'filter03' })
        splink.reg(filter1, { category: 'filter', id: 'filter01' })
      })

      this.executeController({ filters: [ 'filter02' ] }, function () {
        setTimeout(function () { // unfortunate hack, need a better way of intercepting the controller call
          assert.equals(controller.callCount, 1)
          // all should be properly ordered because they are all from ids
          assert.equals(calls, [ 'one', 'two', 'three', 'four' ])
          done()
        }, 10)
      }.bind(this))
    }
})