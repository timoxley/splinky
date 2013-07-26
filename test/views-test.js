var buster            = require('bustermove')
  , assert            = buster.assert
  , refute            = buster.refute
  , consolidate       = require('consolidate')
  , fs                = require('fs')
  , Splinky           = require('../')
  , hijackSplinkScan  = require('./common').hijackSplinkScan
  , restoreSplinkScan = require('./common').restoreSplinkScan

buster.testCase('Views', {
    'setUp': function () {
      this.consolidateMock = this.mock(consolidate)
      this.fsMock          = this.mock(fs)
    }

  , 'tearDown': restoreSplinkScan

  , 'test no processor': function (done) {
      var model = { model: 1 }
        , ssmvc
        , viewfn

      ssmvc = Splinky({}).init()

      viewfn = ssmvc._splink.byId('viewManager')()

      assert.equals(typeof viewfn, 'function')

      viewfn('foobar', model, function (err) {
        assert(err)
        assert.match(err.toString(), /no view processor/i)
        done()
      })
    }

  , 'test simple manual processor': function (done) {
      var stub  = this.stub()
        , model = { model: 1 }
        , data  = { data: 1 }
        , ssmvc
        , viewfn

      ssmvc = Splinky({
          'views': {
              path: '/a/path/to/views'
            , suffix: 'swag'
            , processor: stub
          }
      }).init()

      viewfn = ssmvc._splink.byId('viewManager')()

      assert.equals(typeof viewfn, 'function')

      this.fsMock.expects('stat', '/a/path/to/views/foobar.swag').callsArgWith(1, null, { isFile: function () { return true } })
      stub.callsArgWith(2, null, data)

      viewfn('foobar', model, function (err, _data) {
        refute(err)
        assert.same(_data, data)
        assert.equals(stub.callCount, 1)
        assert.equals(stub.getCall(0).args[0], '/a/path/to/views/foobar.swag')
        assert.equals(stub.getCall(0).args[1], model)
        done()
      })
    }

    //TODO: test multiple view configs
  , 'test simple manual processor views()': function (done) {
      var stub  = this.stub()
        , model = { model: 1 }
        , data  = { data: 1 }
        , ssmvc
        , viewfn

      ssmvc = Splinky().views({
          path: '/a/path/to/views'
        , suffix: 'swag'
        , processor: stub
      }).init()

      viewfn = ssmvc._splink.byId('viewManager')()

      assert.equals(typeof viewfn, 'function')

      this.fsMock.expects('stat', '/a/path/to/views/foobar.swag').callsArgWith(1, null, { isFile: function () { return true } })
      stub.callsArgWith(2, null, data)

      viewfn('foobar', model, function (err, _data) {
        refute(err)
        assert.same(_data, data)
        assert.equals(stub.callCount, 1)
        assert.equals(stub.getCall(0).args[0], '/a/path/to/views/foobar.swag')
        assert.equals(stub.getCall(0).args[1], model)
        done()
      })
    }

  , 'test multiple manual processors': {
        'setUp': function () {
          this.stub1 = this.stub()
          this.stub2 = this.stub()
          this.stub3 = this.stub()
          this.model = { model: 1 }
          this.data  = { data: 1 }
          this.ssmvc
          this.viewfn

          this.ssmvc = Splinky({
              'views': [
                  {
                      path: '/a/path/to/views'
                    , suffix: 'swag'
                    , processor: this.stub1
                  }
                , {
                      path: '/a/path/to/views'
                    , suffix: 'foobar'
                    , processor: this.stub2
                  }
                , {
                      path: './relative/path'
                    , suffix: 'html'
                    , processor: this.stub3
                  }
              ]
          }).init()
          this.viewfn = this.ssmvc._splink.byId('viewManager')()
          assert.equals(typeof this.viewfn, 'function')
        }

      , 'first view': function (done) {
          this.fsMock.expects('stat', '/a/path/to/views/foobar.swag').once().callsArgWith(1, null, { isFile: function () { return true } })
          this.stub1.callsArgWith(2, null, this.data)

          this.viewfn('foobar', this.model, function (err, _data) {
            refute(err)
            assert.same(_data, this.data)
            assert.equals(this.stub1.callCount, 1)
            assert.equals(this.stub1.getCall(0).args[0], '/a/path/to/views/foobar.swag')
            assert.equals(this.stub1.getCall(0).args[1], this.model)
            done()
          }.bind(this))
        }

      , 'second view': function (done) {
          this.fsMock.expects('stat', '/a/path/to/views/foobar.swag').once().callsArgWith(1, 'No such file')
          this.fsMock.expects('stat', '/a/path/to/views/foobar.foobar').once().callsArgWith(1, null, { isFile: function () { return true } })
          this.stub2.callsArgWith(2, null, this.data)

          this.viewfn('foobar', this.model, function (err, _data) {
            refute(err)
            assert.same(_data, this.data)
            assert.equals(this.stub2.callCount, 1)
            assert.equals(this.stub2.getCall(0).args[0], '/a/path/to/views/foobar.foobar')
            assert.equals(this.stub2.getCall(0).args[1], this.model)
            done()
          }.bind(this))
        }

      , 'third view': function (done) {
          this.fsMock.expects('stat', '/a/path/to/views/foobar.swag').once().callsArgWith(1, 'No such file')
          this.fsMock.expects('stat', '/a/path/to/views/foobar.foobar').once().callsArgWith(1, 'No such file')
          this.fsMock.expects('stat', './relative/path/foobar.html').once().callsArgWith(1, null, { isFile: function () { return true } })
          this.stub3.callsArgWith(2, null, this.data)

          this.viewfn('foobar', this.model, function (err, _data) {
            refute(err)
            assert.same(_data, this.data)
            assert.equals(this.stub3.callCount, 1)
            assert.equals(this.stub3.getCall(0).args[0], 'relative/path/foobar.html')
            assert.equals(this.stub3.getCall(0).args[1], this.model)
            done()
          }.bind(this))
        }
    }

  , 'test processor from consolidate': function (done) {
      var model  = { model: 1 }
        , data   = { data: 1 }
        , ssmvc
        , viewfn

      this.fsMock.expects('stat', '/a/path/to/views/foobar.swig').callsArgWith(1, null, { isFile: function () { return true } })
      this.consolidateMock.expects('swig', '/a/path/to/views/foobar.swig').callsArgWith(2, null, data)

      ssmvc = Splinky({
          'views': {
              path: '/a/path/to/views'
            , suffix: 'swig'
            , processor: 'swig'
          }
      }).init()

      viewfn = ssmvc._splink.byId('viewManager')()

      assert.equals(typeof viewfn, 'function')

      viewfn('foobar', model, function (err, _data) {
        refute(err)
        assert.same(_data, data)
        done()
      })
    }

  , 'test processor from splink obj': function (done) {
      var stub  = this.stub()
        , model = { model: 1 }
        , data  = { data: 1 }
        , ssmvc
        , viewfn

      hijackSplinkScan(function (splink) {
        splink.reg(stub, 'vpid')
      })

      ssmvc = Splinky({
          'views': {
              path: '/a/path/to/views'
            , suffix: 'swag'
            , processor: 'vpid'
          }
        , scan: '/foo/bar/'
      }).init()

      viewfn = ssmvc._splink.byId('viewManager')()

      assert.equals(typeof viewfn, 'function')

      this.fsMock.expects('stat', '/a/path/to/views/foobar.swag').callsArgWith(1, null, { isFile: function () { return true } })
      stub.callsArgWith(2, null, data)

      viewfn('foobar', model, function (err, _data) {
        refute(err)
        assert.same(_data, data)
        assert.equals(stub.callCount, 1)
        assert.equals(stub.getCall(0).args[0], '/a/path/to/views/foobar.swag')
        assert.equals(stub.getCall(0).args[1], model)
        done()
      })
    }

  , 'test non-path processor': function (done) {
      var stub  = this.stub()
        , model = { model: 1 }
        , data  = { data: 1 }
        , ssmvc
        , viewfn

      ssmvc = Splinky({
          'views': { processor: stub }
      }).init()

      viewfn = ssmvc._splink.byId('viewManager')()

      assert.equals(typeof viewfn, 'function')

      stub.callsArgWith(2, null, data)

      viewfn('foobar', model, function (err, _data) {
        refute(err)
        assert.same(_data, data)
        assert.equals(stub.callCount, 1)
        assert.equals(stub.getCall(0).args[0], 'foobar')
        assert.equals(stub.getCall(0).args[1], model)
        done()
      })
    }

  , 'test toString processor': function (done) {
      var model = { model: 1 }
        , data  = { data: 1, toString: function () { return 'BOOYA!' } }
        , ssmvc
        , viewfn

      ssmvc = Splinky({
          'views': { processor: 'toStringViewProcessor' }
      }).init()

      viewfn = ssmvc._splink.byId('viewManager')()

      assert.equals(typeof viewfn, 'function')

      viewfn(data, model, function (err, _data) {
        refute(err)
        assert.equals(_data, { content: 'BOOYA!', contentType: 'text/plain' })
        done()
      })
    }

  , 'test json processor': function (done) {
      var model = { model: 1 }
        , data  = { data: 1 }
        , ssmvc
        , viewfn

      ssmvc = Splinky({
          'views': { processor: 'jsonViewProcessor' }
      }).init()

      viewfn = ssmvc._splink.byId('viewManager')()

      assert.equals(typeof viewfn, 'function')

      viewfn(data, model, function (err, _data) {
        refute(err)
        assert.equals(_data, { content: JSON.stringify(data, null, 2), contentType: 'application/json' })
        done()
      })
    }

  , 'test controller-supplied processor': function (done) {
      var stub1 = this.stub()
        , stub2 = this.stub()
        , model = { model: 1 }
        , data  = { data: 1 }
        , ssmvc
        , viewfn

      stub1.callsArgWith(2, null, data)
      stub2.callsArgWith(2, null, data)

      ssmvc = Splinky({
          'views': {
              path: '/a/path/to/views'
            , suffix: 'swag'
            , processor: stub1
          }
      }).init()

      viewfn = ssmvc._splink.byId('viewManager')()

      assert.equals(typeof viewfn, 'function')

      this.fsMock.expects('stat', '/a/path/to/views/foobar.swag').callsArgWith(1, null, { isFile: function () { return true } })

      viewfn('foobar', model, function (err, _data) {
        refute(err)
        assert.same(_data, data)
        assert.equals(stub1.callCount, 1)
        assert.equals(stub2.callCount, 0)
        assert.equals(stub1.getCall(0).args[0], '/a/path/to/views/foobar.swag')
        assert.equals(stub1.getCall(0).args[1], model)

        viewfn = ssmvc._splink.byId('viewManager')({
            path: '/gaws/path'
          , suffix: 'gaws'
          , processor: stub2
        })

        this.fsMock.expects('stat', '/a/path/to/views/foobarbaz.swag').callsArgWith(1, 'does not exist')
        this.fsMock.expects('stat', '/gaws/path/foobarbaz.gaws').callsArgWith(1, null, { isFile: function () { return true } })

        viewfn('foobarbaz', model, function (err, _data) {
          refute(err)
          assert.same(_data, data)
          assert.equals(stub1.callCount, 1)
          assert.equals(stub2.callCount, 1)
          assert.equals(stub2.getCall(0).args[0], '/gaws/path/foobarbaz.gaws')
          assert.equals(stub2.getCall(0).args[1], model)
          done()
        })
      }.bind(this))
    }

})