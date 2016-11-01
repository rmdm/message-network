var inherits = require('util').inherits
var EventEmitter = require('events').EventEmitter

module.exports = Node

inherits(Node, EventEmitter)

function Node () {
    if (!(this instanceof Node)) {
        return new Node()
    }
}

Node.prototype.listen = function (params) {
    this.emit('listen', params)
}

Node.prototype.send = function (params) {
    this.emit('send', params)
}

Node.prototype.unlisten = function (params) {
    this.emit('unlisten', params)
}
