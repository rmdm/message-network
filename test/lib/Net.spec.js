describe('Net class', function () {

    var assert = require('assert')
    var Net = require('../..//lib/Net.js')

    describe('constructor', function () {

        it('returns an instance of Net class when called as a function', function () {
            var enet = Net()
            assert(enet instanceof Net)
        })

    })

    describe('node method', function () {

        it('returns a connected node of the network by its name', function () {
            var enet = Net()
            var node = {}
            enet.connect('node', node)

            var result = enet.node('node')

            assert.equal(enet.node('node'), node)
        })

        it.skip('returns a connected gate of the network by its name', function () {

        })

    })

    describe('names method', function () {

        it('returns a connected node names of the network by node', function () {
            var enet = Net()
            var node = {}
            enet.connect('node', node)
            enet.connect('another-node', node)

            var names = enet.names(node).sort()

            assert.deepEqual(
                names,
                ['another-node', 'node']
            )
        })

        it.skip('returns a connected gate nems of the network by gate', function () {

        })

    })

    describe('connect method', function () {

        it.skip('connects an enet.Node instance node', function () {

        })

    })

    describe('disconnect method', function () {

        it('', function () {

        })

    })

    describe('reconnect method', function () {

        it('', function () {

        })

    })

})
