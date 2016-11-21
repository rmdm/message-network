var Node = require('./Node')
var Gate = require('./Gate')
var MemoryGate = require('./MemoryGate')
var EventEmitter = require('events').EventEmitter

var HandlersMap = require('./util/HandlersMap')

module.exports = Net

function Net () {
    if (!(this instanceof Net)) {
        return new Net()
    }

    this._nodes = {}
    this._gates = {}
    this._handlers = new HandlersMap()

    this._listeners = {}
}

Net.prototype.connect = function (name, node, options) {
    if (typeof name !== 'string') { throw new Error('Node name must be a string.') }
    if (name === '*') { throw new Error('Node name "*" cannot be set.') }
    if (name === '') { throw new Error('Node name "" cannot be set.') }
    if (!node || typeof node !== 'object') { throw new Error('Node must be an object.') }
    if (this._nodes[name]) {
        throw new Error('Node name "'.concat(name, '" is already used.'))
    }

    options = options || {}

    if (!(node instanceof Node)) {

        if (node instanceof Net) {

            var net = node
            var gate = MemoryGate()
            node = MemoryGate()

            net.connect(options.remoteGateName, gate)
            node.link(gate)

        } else if (node instanceof EventEmitter) {

            var ee = node
            node = Node()

            if (Array.isArray(options.events)) {
                options.events.forEach(function (event) {
                    ee.on(event, function (data) {
                        var params = {
                            to: '*',
                            topic: event,
                        }
                        if (typeof data !== 'undefined') {
                            params.data = data
                        }
                        node.send(params)
                    })
                })
            }

        } else {
            node = Node(node)
        }
    }

    if (node instanceof Gate) {
        this._gates[name] = node
    }

    this._listeners[name] = {}

    var listenListener = function (params) {
        params = copy(params)
        params.as = name
        this.listen(params)
    }.bind(this)
    node.on('listen', listenListener)

    var sendListener = function (params) {
        params = copy(params)
        if (this._gates[name]) {
            params.as = {
                gate: name,
                node: params.as.node || params.as,
            }
        } else { params.as = name }
        this.send(params)
    }.bind(this)
    node.on('send', sendListener)

    var unlistenListener = function (params) {
        params = copy(params)
        params.as = name
        this.unlisten(params)
    }.bind(this)
    node.on('unlisten', unlistenListener)

    this._listeners[name]['listen'] = listenListener
    this._listeners[name]['send'] = sendListener
    this._listeners[name]['unlisten'] = unlistenListener

    this._nodes[name] = node

    return this
}

function copy (obj) {
    var o = {}
    for (var k in obj) { o[k] = obj[k] }
    return o
}

Net.prototype.disconnect = function (name) {
    var node = this.node(name)
    if (node) {
        node.unlisten({
            to: '*',
        })
        node.removeListener('listen', this._listeners[name]['listen'])
        node.removeListener('send', this._listeners[name]['send'])
        node.removeListener('unlisten', this._listeners[name]['unlisten'])
    }

    delete this._listeners[name]
    delete this._gates[name]
    delete this._nodes[name]
    return this
}

Net.prototype.reconnect = function (name, node, options) {
    this.disconnect(name).connect(name, node, options)
    return this
}

Net.prototype.node = function (name) {
    return this._nodes[name] || null
}

Net.prototype.names = function (node) {
    var names = []
    for (var name in this._nodes) {
        if (this._nodes[name] === node) {
            names.push(name)
        }
    }
    return names
}

Net.prototype.listen = function (params) {
    this._handlers.add(params)
    return this
}

Net.prototype.send = function (params) {
    this._handlers.exec(params, {
        gates: this._gates,
        nodes: this._nodes,
    })
    return this
}

Net.prototype.unlisten = function (params) {
    this._handlers.remove(params)
    return this
}
