describe('BaseError class', function () {

    var assert = require('assert')
    var BaseError = require('../../lib/BaseError')
    var DisconnectedError = require('../../lib/DisconnectedError')
    var TimeoutError = require('../../lib/TimeoutError')

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

    describe('serialize class method', function () {

        it('returns object representation of the error', function () {
            var be = new BaseError('message', {data: 'data'})
            var obj = BaseError.serialize(be)

            assert.deepEqual(obj, {
                name: 'BaseError',
                message: 'message',
                data: {data: 'data'},
            })
        })

    })

    describe('deserialize method', function () {

        it('returns error instance of BaseError class', function () {
            var obj = {
                name: 'BaseError',
                message: 'message',
                data: {data: 'data'},
            }

            var be = BaseError.deserialize(obj)

            assert(be instanceof BaseError)
            assert.equal(be.name, 'BaseError')
            assert.equal(be.message, 'message')
            assert.deepEqual(be.data, {data: 'data'})
        })

        it('returns error instance of DisconnectedError class', function () {
            var obj = {
                name: 'DisconnectedError',
                message: 'message',
                data: {data: 'data'},
            }

            var be = BaseError.deserialize(obj)

            assert(be instanceof DisconnectedError)
            assert.equal(be.name, 'DisconnectedError')
            assert.equal(be.message, 'message')
            assert.deepEqual(be.data, {data: 'data'})
        })

        it('returns error instance of TimeoutError class', function () {
            var obj = {
                name: 'TimeoutError',
                message: 'message',
                data: {data: 'data'},
            }

            var be = BaseError.deserialize(obj)

            assert(be instanceof TimeoutError)
            assert.equal(be.name, 'TimeoutError')
            assert.equal(be.message, 'message')
            assert.deepEqual(be.data, {data: 'data'})
        })

        it('returns error instance of BaseError class when object withot name is passed', function () {
            var obj = {
                message: 'message',
                data: {data: 'data'},
            }

            var be = BaseError.deserialize(obj)

            assert(be instanceof BaseError)
            assert.equal(be.name, 'BaseError')
            assert.equal(be.message, 'message')
            assert.deepEqual(be.data, {data: 'data'})
        })

    })

})
