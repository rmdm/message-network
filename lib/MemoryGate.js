var inherits = require('util').inherits
var Gate = require('./Gate')

module.exports = MemoryGate

inherits(MemoryGate, Gate)

function MemoryGate (options) {
    if (!(this instanceof MemoryGate)) {
        return new MemoryGate()
    }
    Gate.call(this, options)

    this._endpoint = null
}

MemoryGate.prototype.link = function (memgate) {
    if (!(memgate instanceof MemoryGate)) {
        throw new Error('A MemoryGate instance is required.')
    }
    if (!this._endpoint) {
        this._endpoint = memgate
        memgate.link(this)
    }
}

MemoryGate.prototype._transfer = function (data) {
    if (!this._endpoint) {
        throw new Error('An endpoint is required.')
    }
    return this._endpoint.receive(data)
}
