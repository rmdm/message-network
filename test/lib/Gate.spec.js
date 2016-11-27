describe('Gate class', function () {

    var assert = require('assert')
    var sinon = require('sinon')

    var Gate = require('../../lib/Gate')
    var errors = require('../../lib/errors')

    var gate, handler
    beforeEach(function () {
        gate = Gate()
        handler = sinon.spy()
    })

    describe('constructor', function () {

        it('does not set options on instance', function () {
            var prop = {}
            var fn = function () {}
            var prim = 5

            var gate = Gate({
                prop: prop,
                fn: fn,
                prim: prim,
            })

            assert.notEqual(gate.prop, prop)
            assert.notEqual(gate.fn, fn)
            assert.notEqual(gate.prim, prim)
        })

    })

    describe('listen method', function () {

        it('ignores passed handler param', function () {
            gate.once('listen', function (params) {
                assert.equal(params.to, 'node')
                assert.equal(params.topic, 'check')
                assert.notEqual(params.handler, handler)
            })

            gate.listen({
                to: 'node',
                topic: 'check',
                handler: handler,
            })
        })

        it('uses gate\'s bound transfer method as a handler', function () {
            sinon.stub(gate, 'transfer')

            gate.once('listen', function (params) {
                assert.equal(params.to, 'node')
                assert.equal(params.topic, 'check')
                params.handler()
                assert(gate.transfer.called)
            })

            gate.listen({
                to: 'node',
                topic: 'check',
                handler: handler,
            })
        })

    })

    describe('_transfer method', function () {

        it('throws "Not implemented" error', function () {
            assert(gate instanceof Gate)
            assert.throws(function () {
                gate._transfer()
            })
        })

    })

    describe('transfer method', function () {

        it('calls "refuse" when passed data of unexpected format', function () {
            var refuse = sinon.spy()

            gate.transfer({}, {}, {refuse: refuse})
            assert(refuse.called)
        })

        it('does not call "refuse" when passed data of expected format', function () {
            var refuse = sinon.spy()
            sinon.stub(gate, '_transfer')

            gate.transfer({}, {node: 'gatenode', data: {}}, {refuse: refuse})
            assert(!refuse.called)
        })

        it('registers context callbacks', function () {
            var reply = sinon.spy()
            var refuse = sinon.spy()
            sinon.stub(gate, '_transfer')

            gate.transfer({}, {node: 'gatenode', data: {}}, {
                sender: 'node',
                topic: 'topic',
                reply: reply,
                refuse: refuse,
            })

            var registeredCallbacks = gate._callbacks.remove(1)

            assert.equal(registeredCallbacks.reply, reply)
            assert.equal(registeredCallbacks.refuse, refuse)
        })

        it('calls _transfer method with data to transfer', function () {
            var reply = sinon.spy()
            var refuse = sinon.spy()
            sinon.stub(gate, '_transfer')

            gate.transfer({}, {node: 'gatenode', data: {}}, {
                sender: 'node',
                topic: 'topic',
                reply: reply,
                refuse: refuse,
            })

            assert(gate._transfer.calledWithMatch({
                id: 1,
                node: 'gatenode',
                data: {},
                sender: 'node',
                topic: 'topic',
            }))
        })

        it('calls _transfer with serialized error to transfer when isRefuse is set', function () {
            var reply = sinon.spy()
            var refuse = sinon.spy()
            sinon.stub(gate, '_transfer')

            gate.transfer({
                isRefuse: true
            }, {
                node: 'gatenode',
                data: new errors.BaseError('an error', {some: 'data'}),
            }, {
                sender: 'node',
                topic: 'topic',
                reply: reply,
                refuse: refuse,
            })

            assert(gate._transfer.calledWithMatch({
                id: 1,
                node: 'gatenode',
                data: {
                    name: 'BaseError',
                    message: 'an error',
                    data: {some: 'data'},
                },
                sender: 'node',
                topic: 'topic',
            }))
        })

        it('calls _transfer with serialized error data to transfer when isRefuse is set', function () {
            var reply = sinon.spy()
            var refuse = sinon.spy()
            sinon.stub(gate, '_transfer')

            gate.transfer({
                isRefuse: true
            }, {
                node: 'gatenode',
                data: {metrics: [1, 2, 3]},
            }, {
                sender: 'node',
                topic: 'topic',
                reply: reply,
                refuse: refuse,
            })

            assert(gate._transfer.calledWithMatch({
                id: 1,
                node: 'gatenode',
                data: {
                    data: {metrics: [1, 2, 3]},
                },
                sender: 'node',
                topic: 'topic',
            }))
        })

    })

    describe('receive method', function () {

        it('calls send method when request is received', function () {
            sinon.stub(gate, 'transfer')
            sinon.stub(gate, 'send')

            gate.receive({
                id: 1,
                request: true,
                node: 'gatenode',
                data: {},
                sender: 'node',
                topic: 'topic',
            })

            assert(gate.send.calledWithMatch({
                to: 'gatenode',
                topic: 'topic',
                data: {},
            }))
        })

        it('calls registered reply callback when response is received', function () {
            sinon.stub(gate, 'transfer')
            sinon.stub(gate, 'send')
            var reply = sinon.spy()
            var refuse = sinon.spy()

            gate._callbacks.add({
                reply: reply,
                refuse: refuse,
            })

            gate.receive({
                externalId: 1,
                request: false,
                node: 'gatenode',
                data: {},
                sender: 'node',
                topic: 'topic',
                successHandler: true,
                errorHandler: true,
                isReply: true,
            })

            var call = reply.args[0]

            assert.deepEqual(call[0], {})
            assert.equal(typeof call[1].success, 'function')
            assert.equal(typeof call[1].error, 'function')

        })

        it('calls registered refuse callback when error is received', function () {
            sinon.stub(gate, 'transfer')
            sinon.stub(gate, 'send')
            var reply = sinon.spy()
            var refuse = sinon.spy()

            gate._callbacks.add({
                reply: reply,
                refuse: refuse,
            })

            gate.receive({
                externalId: 1,
                request: false,
                node: 'gatenode',
                data: {
                    name: 'DisconnectedError',
                    message: 'msg',
                    data: {data: 'data'},
                },
                sender: 'node',
                topic: 'topic',
                successHandler: true,
                errorHandler: true,
                isRefuse: true,
            })

            var call = refuse.args[0]

            assert(call[0] instanceof errors.DisconnectedError)
            assert.equal(typeof call[1].success, 'function')
            assert.equal(typeof call[1].error, 'function')
        })

    })

})
