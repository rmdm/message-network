'use strict'

import assert from 'assert'
import BaseError from '../../../lib/errors/BaseError'
import DisconnectedError from '../../../lib/errors/DisconnectedError'
import TimeoutError from '../../../lib/errors/TimeoutError'

describe('BaseError class', function () {

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
