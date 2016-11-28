'use strict'

import assert from 'assert'
import TimeoutError from '../../../lib/errors/TimeoutError'
import BaseError from '../../../lib/errors/BaseError'

describe('TimeoutError class', function () {

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
