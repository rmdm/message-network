'use strict'

import assert from 'assert'
import DisconnectedError from '../../../lib/errors/DisconnectedError'
import BaseError from '../../../lib/errors/BaseError'

describe('DisconnectedError class', function () {

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
