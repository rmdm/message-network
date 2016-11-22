describe('MemoryGate class', function () {

    var assert = require('assert')
    var sinon = require('sinon')

    var MemoryGate = require('../../lib/MemoryGate')

    describe('link method', function () {

        it('accepts other gate and sets each other as endpoints', function () {
            var gate = MemoryGate()
            var anotherGate = MemoryGate()

            gate.link(anotherGate)

            assert.equal(gate._endpoint, anotherGate)
            assert.equal(anotherGate._endpoint, gate)
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

    })

})
