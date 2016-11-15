describe('DisconnectedError class', function () {

    var assert = require('assert')
    var DisconnectedError = require('../../lib/DisconnectedError')
    var BaseError = require('../../lib/BaseError')

    describe('constructor', function () {

        it('creates an instance of the BaseError class', function () {
            var be = new DisconnectedError()
            assert(be instanceof BaseError)
        })

        it('sets error name to "DisconnectedError"', function () {
            var be = new DisconnectedError()
            assert.equal(be.name, 'DisconnectedError')
        })

    })

})
