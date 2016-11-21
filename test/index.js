describe('message-network index', function () {

    var assert = require('assert')

    var index = require('../index')

    var Net = require('../lib/Net')
    var Node = require('../lib/Node')
    var Gate = require('../lib/Gate')
    var MemoryGate = require('../lib/MemoryGate')

    var BaseError = require('../lib/errors/BaseError')
    var DisconnectedError = require('../lib/errors/DisconnectedError')
    var TimeoutError = require('../lib/errors/TimeoutError')

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
