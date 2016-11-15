describe('errors index', function () {

    var assert = require('assert')

    var errors = require('../../../lib/errors')
    var BaseError = errors.BaseError
    var DisconnectedError = errors.DisconnectedError
    var TimeoutError = errors.TimeoutError

    describe('serialize function', function () {

        it('returns object representation of the error', function () {
            var be = new BaseError('message', {data: 'data'})
            var obj = errors.serialize(be)

            assert.deepEqual(obj, {
                name: 'BaseError',
                message: 'message',
                data: {data: 'data'},
            })
        })

    })

    describe('deserialize function', function () {

        it('returns error instance of BaseError class', function () {
            var obj = {
                name: 'BaseError',
                message: 'message',
                data: {data: 'data'},
            }

            var be = errors.deserialize(obj)

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

            var be = errors.deserialize(obj)

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

            var be = errors.deserialize(obj)

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

            var be = errors.deserialize(obj)

            assert(be instanceof BaseError)
            assert.equal(be.name, 'BaseError')
            assert.equal(be.message, 'message')
            assert.deepEqual(be.data, {data: 'data'})
        })

    })

})
