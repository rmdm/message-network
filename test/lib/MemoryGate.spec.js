'use strict'

import assert from 'assert'
import sinon from 'sinon'
import MemoryGate from '../../lib/MemoryGate'

describe('MemoryGate class', function () {

    describe('link method', function () {

        it('accepts other gate and sets each other as endpoints', function () {
            var gate = MemoryGate()
            var anotherGate = MemoryGate()

            gate.link(anotherGate)

            assert.equal(gate._endpoint, anotherGate)
            assert.equal(anotherGate._endpoint, gate)
        })

        it('throws if called with not an instance of MemoryGate', function () {
            var gate = MemoryGate()

            assert.throws(function () {
                gate.link()
            })
        })

    })

    describe('unlink method', function () {

        it('resets gate endpoint', function () {
            var gate = MemoryGate()
            var anotherGate = MemoryGate()

            gate.link(anotherGate)
            gate.unlink()

            assert.equal(gate._endpoint, null)
            assert.equal(anotherGate._endpoint, null)
        })

    })

    describe('_transfer method', function () {

        it('calls "receive" of its endpoint', function () {
            var gate = MemoryGate()
            var anotherGate = MemoryGate()

            sinon.stub(anotherGate, 'receive')

            gate.link(anotherGate)

            gate._transfer({data: 'data'})

            assert(anotherGate.receive.calledWithMatch({data: 'data'}))
        })

        it('throws if called on not linked MemoryGate', function () {
            var gate = MemoryGate()

            assert.throws(function () {
                gate._transfer()
            })
        })

    })

})
