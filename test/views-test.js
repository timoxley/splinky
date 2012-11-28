var buster      = require('buster')
  , assert      = buster.assert
  , consolidate = require('consolidate')
  , fs          = require('fs')
  , splinksmvc  = require('../lib/')

buster.testCase('Views', {
    'setUp': function () {
      this.consolidateMock = this.mock(consolidate)
      this.fsMock          = this.mock(fs)
    }

  , 'test no processor': function (done) {
      var model = { model: 1 }
        , ssmvc
        , viewfn

      ssmvc = splinksmvc({})

      viewfn = ssmvc._splink.byId('viewHandler')

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

      ssmvc = splinksmvc({
          'views': {
              path: '/a/path/to/views'
            , suffix: 'swag'
            , processor: stub
          }
      })

      viewfn = ssmvc._splink.byId('viewHandler')

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

          this.ssmvc = splinksmvc({
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
          })
          this.viewfn = this.ssmvc._splink.byId('viewHandler')
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

      ssmvc = splinksmvc({
          'views': {
              path: '/a/path/to/views'
            , suffix: 'swig'
            , processor: 'swig'
          }
      })

      viewfn = ssmvc._splink.byId('viewHandler')

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

      ssmvc = splinksmvc({
          'views': {
              path: '/a/path/to/views'
            , suffix: 'swag'
            , processor: 'vpid'
          }
      })

      ssmvc._splink.byId('externalSplink').reg(stub, 'vpid')

      viewfn = ssmvc._splink.byId('viewHandler')

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
})