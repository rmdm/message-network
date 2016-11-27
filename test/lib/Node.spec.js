describe('Node class', function () {

    var assert = require('assert')
    var Node = require('../../lib/Node')

    describe('constructor', function () {

        it('sets passed properties on the instance', function () {
            var prop = {}
            var fn = function () {}
            var prim = 5

            var node = Node({
                prop: prop,
                fn: fn,
                prim: prim,
            })

            assert.equal(node.prop, prop)
            assert.equal(node.fn, fn)
            assert.equal(node.prim, prim)
        })

        it('returns passed node instance', function () {
            var node = Node()

            var returnedNode = Node(node)

            assert.equal(returnedNode, node)
        })

    })

    describe('listen method', function () {

        it('notify its listeners on "listen" event', function () {
            var node = Node()

            var called = false

            node.once('listen', function (payload) {
                called = true
                assert.deepEqual(payload, {
                    to: 'calculator',
                    topic: 'add',
                    data: [1, 2],
                })
            })

            node.listen({
                to: 'calculator',
                topic: 'add',
                data: [1, 2],
            })

            assert(called)
        })

    })

    describe('send method', function () {

        it('notify its listeners on "send" event', function () {
            var node = Node()

            var called = false

            node.once('send', function (payload) {
                called = true
                assert.deepEqual(payload, {
                    to: 'progressbar',
                    topic: 'progress',
                    data: 100,
                })
            })

            node.send({
                to: 'progressbar',
                topic: 'progress',
                data: 100,
            })

            assert(called)
        })

    })

    describe('unlisten method', function () {

        it('notify its listeners on "unlisten" event', function () {
            var node = Node()

            var called = false

            var add = function (data) {}

            node.once('unlisten', function (payload) {
                called = true
                assert.deepEqual(payload, {
                    from: ['cheater'],
                    topic: 'add',
                    handler: add,
                })
            })

            node.unlisten({
                from: ['cheater'],
                topic: 'add',
                handler: add,
            })

            assert(called)
        })

    })

})
