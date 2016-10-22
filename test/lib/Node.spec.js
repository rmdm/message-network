describe('Node class', function () {

    var assert = require('assert')
    var Node = require('../../lib/Node')

    describe('request method', function () {

        it('notify its "request" event listeners', function () {
            var node = Node()

            var called = false

            node.once('request', function (payload) {
                called = true
                assert.deepEqual(payload, {
                    to: 'calculator',
                    action: 'add',
                    data: [1, 2],
                })
            })

            node.request({
                to: 'calculator',
                action: 'add',
                data: [1, 2],
            })

            assert(called)
        })

    })

    describe('notify method', function () {

        it('notify its "notify" event listeners', function () {
            var node = Node()

            var called = false

            node.once('notify', function (payload) {
                called = true
                assert.deepEqual(payload, {
                    to: 'progressbar',
                    event: 'progress',
                    data: 100,
                })
            })

            node.notify({
                to: 'progressbar',
                event: 'progress',
                data: 100,
            })

            assert(called)
        })

    })

    describe('action method', function () {

        it('notify its "action:register" event listeners', function () {
            var node = Node()

            var called = false

            var add = function (data) {}

            node.once('action:register', function (payload) {
                called = true
                assert.deepEqual(payload, {
                    from: ['cheater'],
                    action: 'add',
                    handler: add,
                })
            })

            node.action({
                from: ['cheater'],
                action: 'add',
                handler: add,
            })

            assert(called)
        })

    })

    describe('listen method', function () {

        it('notify its "listen:start" event listeners', function () {
            var node = Node()

            var called = false

            var render = function (data) {}

            node.once('listen:start', function (payload) {
                called = true
                assert.deepEqual(payload, {
                    from: ['process'],
                    event: 'progress',
                    handler: render,
                })
            })

            node.listen({
                from: ['process'],
                event: 'progress',
                handler: render,
            })

            assert(called)
        })

    })

    describe('cancelAction method', function () {

        it('notify its "action:cancel" event listeners', function () {
            var node = Node()

            var called = false

            var render = function (data) {}

            node.once('action:cancel', function (payload) {
                called = true
                assert.deepEqual(payload, {
                    from: ['cheater'],
                })
            })

            node.cancelAction({
                from: ['cheater'],
            })

            assert(called)
        })

    })

    describe('stopListen method', function () {

        it('notify its "listen:stop" event listeners', function () {
            var node = Node()

            var called = false

            var render = function (data) {}

            node.once('listen:stop', function (payload) {
                called = true
                assert.deepEqual(payload, {
                    from: ['process'],
                })
            })

            node.stopListen({
                from: ['process'],
            })

            assert(called)
        })

    })

})
