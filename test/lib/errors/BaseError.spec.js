describe('BaseError class', function () {

    var assert = require('assert')
    var BaseError = require('../../../lib/errors/BaseError')
    var DisconnectedError = require('../../../lib/errors/DisconnectedError')
    var TimeoutError = require('../../../lib/errors/TimeoutError')

    describe('constructor', function () {

        it('creates an instance of the Error class', function () {
            var be = new BaseError()
            assert(be instanceof Error)
        })

        it('creates error that does not capture stack trace', function () {
            var be = new BaseError()
            assert(!be.stack)
        })

        it('sets message on error instance', function () {
            var be = new BaseError('a message')
            assert.equal(be.message, 'a message')
        })

        it('sets data on error instance', function () {
            var be = new BaseError('message', {data: 'data'})
            assert.deepEqual(be.data, {data: 'data'})
        })

        it('sets error name to "BaseError"', function () {
            var be = new BaseError()
            assert.equal(be.name, 'BaseError')
        })

    })

})
