'use strict'

import Node from './Node'
import Gate from './Gate'
import MemoryGate from './MemoryGate'
import { EventEmitter } from 'events'

import HandlersMap from './util/HandlersMap'

export default Net

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

            const net = node
            const gate = MemoryGate()
            node = MemoryGate()

            net.connect(options.remoteGateName, gate)
            node.link(gate)

        } else if (node instanceof EventEmitter) {

            const ee = node
            node = Node()

            if (Array.isArray(options.events)) {
                options.events.forEach(function (event) {
                    ee.on(event, function (data) {
                        const params = {
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

    const listenListener = (params) => {
        params = copy(params)
        params.as = name
        this.listen(params)
    }
    node.on('listen', listenListener)

    const sendListener = (params) => {
        params = copy(params)
        if (this._gates[name]) {
            params.as = {
                gate: name,
                node: params.as.node || params.as,
            }
        } else { params.as = name }
        this.send(params)
    }
    node.on('send', sendListener)

    const unlistenListener = (params) => {
        params = copy(params)
        params.as = name
        this.unlisten(params)
    }
    node.on('unlisten', unlistenListener)

    this._listeners[name]['listen'] = listenListener
    this._listeners[name]['send'] = sendListener
    this._listeners[name]['unlisten'] = unlistenListener

    this._nodes[name] = node

    return this
}

function copy (obj) {
    const o = {}
    for (const k in obj) { o[k] = obj[k] }
    return o
}

Net.prototype.disconnect = function (name) {
    const node = this.node(name)
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
    const names = []
    for (const name in this._nodes) {
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
