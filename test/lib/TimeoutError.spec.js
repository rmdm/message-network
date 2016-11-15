describe('TimeoutError class', function () {

    var assert = require('assert')
    var TimeoutError = require('../../lib/TimeoutError')
    var BaseError = require('../../lib/BaseError')

    describe('constructor', function () {

        it('creates an instance of the BaseError class', function () {
            var be = new TimeoutError()
            assert(be instanceof BaseError)
        })

        it('sets error name to "TimeoutError"', function () {
            var be = new TimeoutError()
            assert.equal(be.name, 'TimeoutError')
        })

    })

})
