var inherits = require('util').inherits
var EventEmitter = require('events').EventEmitter

module.exports = Node

inherits(Node, EventEmitter)

function Node () {
    if (!(this instanceof Node)) {
        return new Node()
    }
}

Node.prototype.request = function (params) {
    this.emit('request', params)
}

Node.prototype.notify = function (params) {
    this.emit('notify', params)
}

Node.prototype.action = function (params) {
    this.emit('action:register', params)
}

Node.prototype.listen = function (params) {
    this.emit('listen:start', params)
}

Node.prototype.cancelAction = function (params) {
    this.emit('action:cancel', params)
}

Node.prototype.stopListen = function (params) {
    this.emit('listen:stop', params)
}
