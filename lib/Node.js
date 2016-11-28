'use strict'

import { inherits } from 'util'
import { EventEmitter } from 'events'

export default Node

inherits(Node, EventEmitter)

function Node (properties) {
    if (properties instanceof Node) {
        return properties
    }

    if (!(this instanceof Node)) {
        return new Node(properties)
    }

    if (typeof properties === 'object' && properties) {
        const keys = Object.keys(properties)
        for (const key of keys) {
            this[key] = properties[key]
        }
    }
}

Node.prototype.listen = function (params) {
    this.emit('listen', params)
    return this
}

Node.prototype.send = function (params) {
    this.emit('send', params)
    return this
}

Node.prototype.unlisten = function (params) {
    this.emit('unlisten', params)
    return this
}
