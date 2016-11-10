var Node = require('./Node')
var Gate = require('./Gate')
var MemoryGate = require('./MemoryGate')
var EventEmitter = require('events').EventEmitter

module.exports = Net

function Net () {
    if (!(this instanceof Net)) {
        return new Net()
    }

    this._nodes = {}
    this._gates = {}
    this._handlers = {
        gates: {},
        nodes: {},
    }

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

    addHandler(this._handlers, params)
    return this
}

function addHandler (handlers, params) {
    var sources = params.to

    if (!Array.isArray(sources)) {
        sources = [sources]
    }

    for (var i = 0; i < sources.length; i++) {
        var source = sources[i]
        addSourceHandler(handlers, source, params)
    }
}

function addSourceHandler (handlers, source, params) {
    var nodeNames = source.node || source

    if (!source.gate) {
        return addGateHandler(handlers.nodes, null, nodeNames, params)
    }

    var gates = handlers.gates
    var gateNames = source.gate

    if (!Array.isArray(gateNames)) {
        gateNames = [gateNames]
    }

    for (var i = 0; i < gateNames.length; i++) {
        var gateName = gateNames[i]
        gates[gateName] = gates[gateName] || {}
        var gate = gates[gateName]
        addGateHandler(gate, gateName, nodeNames, params)
    }
}

function addGateHandler (gate, gateName, nodeNames, params) {
    if (!Array.isArray(nodeNames)) {
        nodeNames = [nodeNames]
    }

    for (var i = 0; i < nodeNames.length; i++) {
        var nodeName = nodeNames[i]
        addNodeHandler(gate, gateName, nodeName, params)
    }
}

function addNodeHandler (nodes, gateName, nodeName, params) {
    nodes[nodeName] = nodes[nodeName] || {}
    var destinations = nodes[nodeName]

    var listenerNodeName = params.as

    destinations[listenerNodeName] = destinations[listenerNodeName] || {}
    var topics = destinations[listenerNodeName]

    var topicNames = params.topic

    if (!Array.isArray(topicNames)) {
        topicNames = [topicNames]
    }

    for (var i = 0; i < topicNames.length; i++) {
        var topicName = topicNames[i]
        addTopicHandler(topics, topicName, params)
    }
}

function addTopicHandler (topics, topicName, params) {
    topics[topicName] = topics[topicName] || []
    var handlers = topics[topicName]

    var topicHandlers = params.handler
    if (!Array.isArray(topicHandlers)) {
        topicHandlers = [topicHandlers]
    }

    Array.prototype.push.apply(handlers, topicHandlers)
}

Net.prototype.send = function (params) {
    if (!params.as) { throw new Error('"as" is required.') }
    if (!params.to) { throw new Error('"to" is required.') }
    if (!params.topic) { throw new Error('"topic" is required.') }

    checkDestinations(params.to, params.as)

    send(this._handlers, params, {gates: this._gates, nodes: this._nodes})
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

function send (handlers, params, options) {
    options.calls = new Map()

    var gateName = params.as.gate

    sendGate(handlers.gates['*'], params, options)

    if (!gateName) {
        sendGate(handlers.nodes, params, options)
        return
    }

    sendGate(handlers.gates[gateName], params, options)
}

function sendGate (gate, params, options) {
    if (!gate) { return }

    var nodeName = params.as.node || params.as

    sendNode(gate['*'], params, options)
    sendNode(gate[nodeName], params, options)
}

function sendNode (node, params, options) {
    if (!node) { return }

    var destinations = params.to

    if (!Array.isArray(destinations)) {
        destinations = [destinations]
    }

    for (var i = 0; i < destinations.length; i++) {
        var destination = destinations[i]
        sendDestination(node, destination, params, options)
    }
}

function sendDestination (destinations, destination, params, options) {

    var gateNames = destination.gate
    var nodeNames = destination.node || destination

    if (!gateNames) {
        sendDestinationGate(destinations, null, nodeNames, params, options)
        return
    }

    if (gateNames === '*') {
        gateNames = Object.keys(destinations)
    }

    if (!Array.isArray(gateNames)) {
        gateNames = [gateNames]
    }

    for (var i = 0; i < gateNames.length; i++) {
        var gateName = gateNames[i]
        sendDestinationGate(destinations, gateName, nodeNames, params, options)
    }

}

function sendDestinationGate (destinations, gateName, nodeNames, params, options) {

    if (!gateName && nodeNames === '*') {
        nodeNames = Object.keys(destinations)
    }

    if (!Array.isArray(nodeNames)) {
        nodeNames = [nodeNames]
    }

    if (gateName && options.gates[gateName]) {
        sendDestinationNode(destinations[gateName], gateName, nodeNames, params, options)
        return
    }

    for (var i = 0; i < nodeNames.length; i++) {
        var nodeName = nodeNames[i]
        if (options.gates[nodeName]) { continue }
        sendDestinationNode(destinations[nodeName], gateName, nodeName, params, options)
    }

}

function sendDestinationNode (topics, gateName, nodeName, params, options) {
    if (!topics) { return }

    fireHandlers(topics[params.topic], gateName, nodeName, params, options)
    fireHandlers(topics['*'], gateName, nodeName, params, options)
}

function fireHandlers (handlers, gateName, nodeName, params, options) {
    if (!handlers) { return }
    for (var i = 0; i < handlers.length; i++) {
        var handler = handlers[i]
        if (options.calls.has(handler)) { continue }

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
        options.calls.set(handler, true)
    }
}

function makeContext (as, to, topic, success, error, caller, nodes) {
    var sender = {node: as.node || as}
    if (as.gate) { sender.gate = as.gate }
    var context = {
        sender: sender,
        topic: topic,
    }

    context.reply = success
        ? makeResponseCtxReplyFn(sender, to, topic, success, caller, nodes)
        : function () {}

    context.refuse = error
        ? makeResponseCtxErrorFn(sender, to, topic, error, caller, nodes)
        : function () {}

    return context
}

function makeResponseCtxReplyFn (as, to, topic, callback, caller, nodes) {
    return function (response, options) {
        options = options || {}
        var responseContext = makeContext(to, as, topic, options.success || caller, options.error, callback, nodes)

        var ctxNode = nodes[as.node]

        if (as.gate) {
            setImmediate(callback.bind(ctxNode), {node: as.node, data: response}, responseContext)
        } else {
            setImmediate(callback.bind(ctxNode), response, responseContext)
        }
    }
}

function makeResponseCtxErrorFn (as, to, topic, callback, caller, nodes) {
    return function (error, options) {
        options = options || {}
        var errorContext = makeContext(to, as, topic, options.success || caller, options.error, callback, nodes)

        var ctxNode = nodes[as.node]

        if (as.gate) {
            setImmediate(callback.bind(ctxNode), {node: as.node, data: error}, errorContext)
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

    removeListener(this._handlers, params)
    return this
}

function removeListener (handlers, params) {
    var sources = params.to

    if (!Array.isArray(sources)) {
        sources = [sources]
    }

    for (var i = 0; i < sources.length; i++) {
        var source = sources[i]
        removeSourceListener(handlers, source, params)
    }
}

function removeSourceListener (handlers, source, params) {

    if (!source.gate) {
        var nodeNames = source.node || source
        return removeNodes(handlers.nodes, null, nodeNames, params)
    }

    var nodeNames = source.node

    var gates = handlers.gates
    var gateNames = source.gate

    if (!Array.isArray(gateNames)) {
        gateNames = [gateNames]
    }

    for (var i = 0; i < gateNames.length; i++) {
        var gateName = gateNames[i]
        gates[gateName] = gates[gateName] || {}
        var gate = gates[gateName]
        if (nodeNames) {
            removeNodes(gate, gateName, nodeNames, params)
            if (isEmpty(gate)) {
                delete gates[gateName]
            }
            continue
        }
        delete gates[gateName]
    }
}

function removeNodes (nodes, gateName, nodeNames, params) {
    if (!nodes) { return }

    if (!Array.isArray(nodeNames)) {
        nodeNames = [nodeNames]
    }

    for (var i = 0; i < nodeNames.length; i++) {
        var nodeName = nodeNames[i]
        if (params.topic) {
            var node = nodes[nodeName]
            if (node) {
                removeTopic(node[params.as], params)
                if (isEmpty(node[params.as])) {
                    delete nodes[nodeName]
                }
            }
            continue
        }
        delete nodes[nodeName]
    }
}

function removeTopic (topics, params) {
    if (!topics) { return }

    var topicNames = params.topic

    if (!Array.isArray(topicNames)) {
        topicNames = [topicNames]
    }

    for (var i = 0; i < topicNames.length; i++) {
        var topicName = topicNames[i]
        if (params.handler) {
            var handlers = topics[topicName]
            removeHandler(handlers, params)
            if (!handlers || !handlers.length) {
                delete topics[topicName]
            }
            continue
        }
        delete topics[topicName]
    }
}

function removeHandler (handlers, params) {
    if (!handlers) { return }

    var topicHandlers = params.handler

    if (!Array.isArray(topicHandlers)) {
        topicHandlers = [topicHandlers]
    }

    var tmpHandlers = []

    for (var i = 0; i < handlers.length; i++) {
        var handler = handlers[i]
        var handlerListed = false

        for (var j = 0; j < topicHandlers.length; j++) {
            var topicHandler = topicHandlers[j]
            if (topicHandler === handler) {
                handlerListed = true
                break
            }
        }

        if (!handlerListed) {
            tmpHandlers.push(handler)
        }
    }

    handlers.length = 0
    Array.prototype.push.apply(handlers, tmpHandlers)
}

//---------- utility functions ----------//

function isEmpty (obj) {
    for (var k in obj) {
        if (obj.hasOwnProperty(k)) {
            return false
        }
    }
    return true
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
