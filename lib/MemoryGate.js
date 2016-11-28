'use strict'

import { inherits } from 'util'
import Gate from './Gate'

export default MemoryGate

inherits(MemoryGate, Gate)

function MemoryGate (options) {
    if (!(this instanceof MemoryGate)) {
        return new MemoryGate(options)
    }
    Gate.call(this, options)

    this._endpoint = null
}

MemoryGate.prototype.link = function (memgate) {
    if (!(memgate instanceof MemoryGate)) {
        throw new Error('A MemoryGate instance is required to link to.')
    }
    if (!this._endpoint) {
        this._endpoint = memgate
        memgate.link(this)
    }
    return this
}

MemoryGate.prototype.unlink = function () {
    if (this._endpoint) {
        const endpoint = this._endpoint
        this._endpoint = null
        endpoint.unlink()
    }
    return this
}

MemoryGate.prototype._transfer = function (data) {
    if (!this._endpoint) {
        throw new Error('It is required to link a MemoryGate before transfer.')
    }
    return this._endpoint.receive(data)
}
