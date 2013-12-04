var buster           = require('bustermove')
  , assert           = buster.assert
  , Splinky          = require('../')
  , setupServerMocks = require('./common').setupServerMocks

buster.testCase('Views', {
    'setUp': function () {
      setupServerMocks.call(this)
      this.serverMock.expects('listen').once()

      this.createResponseStub = function () {
        return {
            getHeader : this.spy()
          , setHeader : this.spy()
          , writeHead : this.spy()
          , write     : this.spy()
          , end       : this.spy()
        }
      }.bind(this)
    }

  , 'test redirect auto view processor': {
        'setUp': function () {
          this.execute = function (redir, verify) {
            var resStub        = this.createResponseStub()
              , splinky        = Splinky({})

            function controller (context, callback) {
              callback(null, redir)
            }
            controller.$config = {
                category      : 'controller'
              , route         : '/foo'
            }
            splinky.reg(controller)

            splinky.start(function () {
              var router = splinky._internalSplink.byId('router')
              router.dispatch({ method: 'GET', url: '/foo' }, resStub, function () {
                assert(false, 'should not have got callback')
              })
              verify(resStub)
            }.bind(this))
          }.bind(this)
        }

      , 'simple url redirect': function (done) {
          this.execute(
              { redirect: true, url: 'http://www.google.com/' }
            , function (resStub) {
                assert.equals(resStub.writeHead.callCount, 1, 'called res.writeHead()')
                assert.equals(
                    resStub.writeHead.getCall(0).args
                  , [ 303, { location: 'http://www.google.com/' } ]
                  , 'called res.writeHead with correct args'
                )
                done()
              }
          )
        }

      , '302 redirect': function (done) {
          this.execute(
              { redirect: true, code: 302, url: 'http://www.google.com/' }
            , function (resStub) {
                assert.equals(resStub.writeHead.callCount, 1, 'called res.writeHead()')
                assert.equals(
                    resStub.writeHead.getCall(0).args
                  , [ 302, { location: 'http://www.google.com/' } ]
                  , 'called res.writeHead with correct args'
                )
                done()
              }
          )
        }
      }
})