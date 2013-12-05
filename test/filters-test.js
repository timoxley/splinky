var buster     = require('bustermove')
  , assert     = buster.assert
  , extend     = require('xtend')

  , Splinky           = require('../')
  , hijackSplinkScan  = require('./common').hijackSplinkScan
  , restoreSplinkScan = require('./common').restoreSplinkScan
  , setupServerMocks  = require('./common').setupServerMocks

buster.testCase('Filters', {
    'setUp': function () {
      setupServerMocks.call(this)
      this.serverMock.expects('listen').once()

      this.registerController = function (config, controller, viewProcessor, callback) {
        controller.$config = extend({ category: 'controller', route: '/' }, config)
        hijackSplinkScan(function (splink) {
          splink.reg(controller)
          splink.reg(viewProcessor, { type: 'viewProcessor', id: 'vpstub' })
          callback && callback(null, splink)
        })
      }

      this.executeController = function (config, route, callback) {
        if (typeof route == 'function') {
          callback = route
          route = null
        }

        var ssmvc = Splinky(
          extend({ scan: '/foo/bar/', views: { processor: 'vpstub' } }, config))

        ssmvc.start(function () {
          var router = ssmvc._internalSplink.byId('router')
            , r = router._routes.get.filter(function (r) {
                return route == null || r.route == route
              })[0]

          assert(r, 'have a route')
          assert.equals(typeof r.handler, 'function')
          r.handler()
          callback()
        }.bind(this))
      }
    }

  , 'tearDown': function () {
      restoreSplinkScan()
    }

  , 'single filter is used': function (done) {
      var filter     = this.stub()
        , viewStub   = this.stub()
        , config     = { filters: [ filter ] }
        , controller = this.spy()

      filter.callsArg(1)

      this.registerController({}, controller, viewStub)
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
        , viewStub   = this.stub()
        , config     = { filters: [ filter1, filter2, filter3 ] }
        , controller = this.spy()

      filter1.callsArg(1)
      filter2.callsArg(1)
      filter3.callsArg(1)

      this.registerController({}, controller, viewStub)
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
        , viewStub   = this.stub()
        , config     = { filters: [ filter1, [ filter2, filter3 ] ] }
        , controller = this.spy()

      filter1.callsArg(1)
      filter2.callsArg(1)
      filter3.callsArg(1)

      this.registerController({}, controller, viewStub)
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
        , viewStub   = this.stub()
        , config     = { filters: [ filter1 ] }
        , controller1 = this.spy()
        , controller2 = this.spy()

      filter1.callsArg(1)
      filter2.callsArg(1)
      filter3.callsArg(1)

      // we're going to run these twice so do an extra expects() beyond the ones already set up
      this.httpMock.expects('createServer').once().returns(this.server)
      this.serverMock.expects('listen').once()

      // set these up here because registerController() only does one and we can't
      // call it twice
      controller1.$config = { category: 'controller', route: '/' }
      controller2.$config = { category: 'controller', route: '/foo', filters: [ filter2, filter3 ] }
      hijackSplinkScan(function (splink) {
        splink.reg(controller1)
        splink.reg(controller2)
        splink.reg(viewStub, { type: 'viewProcessor', id: 'vpstub' })
      })

      this.executeController(config, function () {
        assert.equals(controller1.callCount, 1)
        assert.equals(controller2.callCount, 0)
        assert.equals(filter1.callCount, 1)
        assert.equals(filter2.callCount, 0)
        assert.equals(filter3.callCount, 0)

        this.executeController(config, '/foo', function () {
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
        , viewStub   = this.stub()
        , controller = this.spy()

      filter.callsArg(1)

      this.registerController({}, controller, viewStub, function (err, splink) {
        splink.reg(filter, { category: 'filter' })
      })
      this.executeController({}, function () {
        assert.equals(controller.callCount, 1)
        assert.equals(filter.callCount, 1)
        done()
      }.bind(this))
    }

  , 'single style=connect filter from splink scan': function (done) {
      var filter     = this.stub()
        , viewStub   = this.stub()
        , controller = this.spy()

      filter.callsArg(2)

      this.registerController({}, controller, viewStub, function (err, splink) {
        splink.reg(filter, { category: 'filter', style: 'connect' })
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
        , viewStub   = this.stub()
        , controller = this.spy()

      filter1.callsArg(1)
      filter2.callsArg(1)
      filter3.callsArg(1)

      this.registerController({}, controller, viewStub, function (err, splink) {
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

  , 'multiple mixed-style filters from splink scan': function (done) {
      var filter1    = this.stub()
        , filter2    = this.stub()
        , filter3    = this.stub()
        , filter4    = this.stub()
        , viewStub   = this.stub()
        , controller = this.spy()

      filter1.callsArg(1)
      filter2.callsArg(2)
      filter3.callsArg(1)
      filter4.callsArg(2)

      this.registerController({}, controller, viewStub, function (err, splink) {
        splink.reg(filter1, { category: 'filter' })
        splink.reg(filter2, { category: 'filter', style: 'connect' })
        splink.reg(filter3, { category: 'filter' })
        splink.reg(filter4, { category: 'filter', style: 'connect' })
      })
      this.executeController({}, function () {
        assert.equals(controller.callCount, 1)
        assert.equals(filter1.callCount, 1)
        assert.equals(filter2.callCount, 1)
        assert.equals(filter3.callCount, 1)
        assert.equals(filter4.callCount, 1)
        done()
      }.bind(this))
    }

  , 'global filter ordering from config': function (done) {
      var calls      = []
        , mkfilter   = function (id) {
            return function (context, callback) {
              calls.push(id)
              // also tests async filters
              process.nextTick(callback)
            }
          }
        , filter1    = mkfilter('one')
        , filter2    = mkfilter('two')
        , filter3    = mkfilter('three')
        , config     = { filters: [ filter1, filter2, filter3 ] }
        , controller = this.spy()
        , viewStub   = this.stub()

      this.registerController({}, controller, viewStub)
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
            return function (context, callback) {
              calls.push(id)
              // also tests async filters
              process.nextTick(callback)
            }
          }
        , filter1    = mkfilter('one')
        , filter2    = mkfilter('two')
        , filter3    = mkfilter('three')
        , controller = this.spy()
        , viewStub   = this.stub()

      this.registerController({}, controller, viewStub, function (err, splink) {
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
            return function (context, callback) {
              calls.push(id)
              // also tests async filters
              process.nextTick(callback)
            }
          }
        , filter1    = mkfilter('one')
        , filter2    = mkfilter('two')
        , filter3    = mkfilter('three')
        , controller = this.spy()
        , viewStub   = this.stub()

      filter2.$config = { id: 'filter02' }

      this.registerController({}, controller, viewStub, function (err, splink) {
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
            return function (context, callback) {
              calls.push(id)
              // also tests async filters
              process.nextTick(callback)
            }
          }
        , filter1    = mkfilter('one')
        , filter2    = mkfilter('two')
        , filter3    = mkfilter('three')
        , filter4    = mkfilter('four')
        , controller = this.spy()
        , viewStub   = this.stub()

      this.registerController({ filters: [ filter4 ]}, controller, viewStub, function (err, splink) {
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
            return function (context, callback) {
              calls.push(id)
              // also tests async filters
              process.nextTick(callback)
            }
          }
        , filter1    = mkfilter('one')
        , filter2    = mkfilter('two')
        , filter3    = mkfilter('three')
        , filter4    = mkfilter('four')
        , controller = this.spy()
        , viewStub   = this.stub()

      this.registerController({ filters: [ 'filter04' ]}, controller, viewStub, function (err, splink) {
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

  , 'test controller custom context used for filter invocation': function (done) {
      var calls      = []
        , mkfilter   = function (id) {
            return function (context, callback) {
              calls.push({ id: id, ctx: this })
              // also tests async filters
              process.nextTick(callback)
            }
          }
        , filter1    = mkfilter('one')
        , filter2    = mkfilter('two')
        , controller = this.spy()
        , viewStub   = this.stub()

      this.registerController(
            { filters: [ 'filter02' ], context: { p1: 'p1', p2: true, p3: { complex: 'object' } } }
          , controller
          , viewStub
          , function (err, splink) {
              splink.reg(filter1, { id: 'filter01' })
              splink.reg(filter2, { id: 'filter02' })
            }
      )

      this.executeController({ filters: [ 'filter01' ] }, function () {
        setTimeout(function () { // unfortunate hack, need a better way of intercepting the controller call
          assert.equals(controller.callCount, 1)
          // all should be properly ordered because they are all from ids
          assert.equals(calls.map(function (c) { return c.id }), [ 'one', 'two' ])
          assert(calls[0].ctx, 'called with context')
          assert.equals('p1', calls[0].ctx.p1, 'called with context properties')
          assert(true === calls[0].ctx.p2, 'called with context properties')
          assert.equals({ complex: 'object' }, calls[0].ctx.p3, 'called with context properties')
          assert(calls[1].ctx, 'called with context')
          assert.equals('p1', calls[1].ctx.p1, 'called with context properties')
          assert(true === calls[1].ctx.p2, 'called with context properties')
          assert.equals({ complex: 'object' }, calls[1].ctx.p3, 'called with context properties')
          done()
        }, 10)
      }.bind(this))
    }

  , 'test filter can invoke a view and bypass controller': function (done) {
      var mkfilter   = function () {
            return function (context, callback) {
              // also tests async filters
              process.nextTick(function () {
                context.model.foobar = 'doobar'
                callback(null, 'someview')
              })
            }
          }
        , filter1    = mkfilter('one')
        , controller = this.spy()
        , viewStub   = this.stub()

      this.registerController(
            { }
          , controller
          , viewStub
          , function (err, splink) {
              splink.reg(filter1, { id: 'filter01' })
            }
      )

      this.executeController({ filters: [ 'filter01' ] }, function () {
        setTimeout(function () { // unfortunate hack, need a better way of intercepting the controller call
          assert.equals(controller.callCount, 0) // controller not invoked
          assert.equals(viewStub.callCount, 1) // but view is invoked
          assert.equals(viewStub.getCall(0).args[0], 'someview')
          assert.equals(viewStub.getCall(0).args[1], { foobar: 'doobar' })
          done()
        }, 10)
      }.bind(this))
    }

    // this goes for everything put into the external splink too, should be able to depend on "options"
  , 'test filter can access global "options"': function (done) {
      var expectedOptions = { options: 'obj', filters: [ 'filter01' ] }
        , filterStub      = this.spy()
        , filterOptions   = null
        , filterFact      = function () {
            filterOptions = this.options
            return filterStub
          }
        , controller      = this.spy()
        , viewStub        = this.stub()

      this.registerController(
            { }
          , controller
          , viewStub
          , function (err, splink) {
              splink.reg(filterFact, { id: 'filter01', depends: [ 'options' ], type: 'factory' })
            }
      )

      this.executeController(extend(expectedOptions), function () {
        setTimeout(function () { // unfortunate hack, need a better way of intercepting the controller call
          assert.equals(controller.callCount, 0) // controller not invoked
          assert.equals(viewStub.callCount, 0) // but view is invoked
          assert.equals(filterStub.callCount, 1)
          assert(filterOptions, 'got "options" object in filter')
          // can't deepEquals the whole object because executeController() adds more cruft
          assert.equals(expectedOptions.options, filterOptions.options, 'filter got global options')
          assert.equals(expectedOptions.filters, filterOptions.filters, 'filter got global options')
          done()
        }, 10)
      }.bind(this))
    }

  // TODO: test for duplicate filters! if a controller specifies a filter it shouldn't be duplicated
  // from the global config, currently it is
})