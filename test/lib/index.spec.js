'use strict'

import assert from 'assert'
import * as index from '../../lib/index'

import Net from '../../lib/Net'
import Node from '../../lib/Node'
import Gate from '../../lib/Gate'
import MemoryGate from '../../lib/MemoryGate'

import { BaseError, DisconnectedError, TimeoutError } from '../../lib/errors/BaseError'

describe('message-network index', function () {

    it('has Net reference', function () {
        assert.equal(index.Net, Net)
    })

    it('has Node reference', function () {
        assert.equal(index.Node, Node)
    })

    it('has Gate reference', function () {
        assert.equal(index.Gate, Gate)
    })

    it('has MemoryGate reference', function () {
        assert.equal(index.MemoryGate, MemoryGate)
    })

    it('has BaseError reference', function () {
        assert.equal(index.BaseError, BaseError)
    })

    it('has DisconnectedError reference', function () {
        assert.equal(index.DisconnectedError, DisconnectedError)
    })

    it('has TimeoutError reference', function () {
        assert.equal(index.TimeoutError, TimeoutError)
    })

})
