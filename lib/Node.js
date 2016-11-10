var inherits = require('util').inherits
var EventEmitter = require('events').EventEmitter

module.exports = Node

inherits(Node, EventEmitter)

function Node (properties) {
    if (!(this instanceof Node)) {
        return new Node(properties)
    }

    if (typeof properties === 'object' && properties) {
        var keys = Object.keys(properties)
        for (var key of keys) {
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
