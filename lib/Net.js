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
        params = params || {}
        params.as = name
        this.listen(params)
    }.bind(this)
    node.on('listen', listenListener)

    var sendListener = function (params) {
        params = params || {}
        params.as = name
        this.send(params)
    }.bind(this)
    node.on('send', sendListener)

    var unlistenListener = function (params) {
        params = params || {}
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
    if (!params.as) { throw new Error('"as" is required.') }
    if (typeof params.as !== 'string') { throw new Error('"as" param of "listen" method must be a string.') }
    if (!params.to) { throw new Error('"to" is required.') }
    if (!params.topic) { throw new Error('"topic" is required.') }
    if (!params.handler) { throw new Error('"handler" is required.') }

    this._handlers.add(params)
    return this
}

Net.prototype.send = function (params) {
    if (!params.as) { throw new Error('"as" is required.') }
    if (!params.to) { throw new Error('"to" is required.') }
    if (!params.topic) { throw new Error('"topic" is required.') }

    checkDestinations(params.to, params.as)

    var handlers = this._handlers.get(params)

    for (var i = 0; i < handlers.length; i++) {
        var handler = handlers[i]
        fireHandlers(handler.handlers, handler.gate, handler.node, params, {
            gates: this._gates,
            nodes: this._nodes,
        })
    }

    return this
}

function checkDestinations (destinations, source) {
    if (!Array.isArray(destinations)) {
        destinations = [destinations]
    }

    for (var i = 0; i < destinations.length; i++) {
        var destination = destinations[i]
        if (destination.gate && source.gate) {
            throw new Error('sending to a gate from a gate is forbidden.')
        }
    }
}


function fireHandlers (handlers, gateName, nodeName, params, options) {
    if (!(gateName && options.gates[gateName] || !gateName && !options.gates[nodeName])) {
        return
    }

    for (var handler of handlers) {
        var context = makeContext(params.as, {
            gate: gateName,
            node: nodeName,
        }, params.topic, params.success, params.error, handler, options.nodes)

        var ctxNode = options.nodes[gateName || nodeName]

        if (gateName) {
            setImmediate(handler.bind(ctxNode), {node: nodeName, data: params.data}, context)
        } else {
            setImmediate(handler.bind(ctxNode), params.data, context)
        }
    }
}

function makeContext (as, to, topic, success, error, caller, nodes) {
    var sender = {node: as.node || as}
    if (as.gate) { sender.gate = as.gate }
    var context = {
        sender: sender,
        topic: topic,
    }

    var params = {
        as: sender,
        to: to,
        topic: topic,
        caller: caller,
        nodes: nodes,
        called: false,
    }

    context.reply = success ? makeResponseCtxReplyFn(success, params) : function () {}
    context.refuse = error ? makeResponseCtxErrorFn(error, params) : function () {}

    return context
}

function makeResponseCtxReplyFn (callback, params) {
    return function (response, options) {
        if (params.called) { return }

        params.called = true

        options = options || {}
        var responseContext = makeContext(params.to, params.as, params.topic, options.success || params.caller, options.error, callback, params.nodes)

        var ctxNode = params.nodes[params.as.gate || params.as.node]

        if (params.as.gate) {
            setImmediate(callback.bind(ctxNode), {node: params.as.node, data: response}, responseContext)
        } else {
            setImmediate(callback.bind(ctxNode), response, responseContext)
        }
    }
}

function makeResponseCtxErrorFn (callback, params) {
    return function (error, options) {
        if (params.called) { return }

        params.called = true

        options = options || {}
        var errorContext = makeContext(params.to, params.as, params.topic, options.success || params.caller, options.error, callback, params.nodes)

        var ctxNode = params.nodes[params.as.gate || params.as.node]

        if (params.as.gate) {
            setImmediate(callback.bind(ctxNode), {node: params.as.node, data: error}, errorContext)
        } else {
            setImmediate(callback.bind(ctxNode), error, errorContext)
        }
    }
}

var stopListenParamsDeps = {
    'handler': ['topic'],
    'topic': ['to'],
    'to': ['as'],
}

Net.prototype.unlisten = function (params) {
    checkParamsDeps(params, stopListenParamsDeps)

    this._handlers.remove(params)
    return this
}

function checkParamsDeps(params, deps) {
    for (var k in params) {
        var keyDeps = deps[k]
        if (!keyDeps) { continue }

        var found = false

        for (var i = 0; i < keyDeps.length; i++) {
            var keyDep = keyDeps[i]
            if (params[keyDep]) {
                found = true
                break
            }
        }

        if (!found) {
            keyDeps = keyDeps
            .map(function (keyDep) {
                return '"' + keyDep + '"'
            })
            .join(' or ')

            throw new Error('stopListen param "' + k + '" needs ' + keyDeps)
        }
    }
}
