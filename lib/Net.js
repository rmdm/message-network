module.exports = Net

function Net () {
    if (!(this instanceof Net)) {
        return new Net()
    }

    this._nodes = {}
    this._handlers = {
        gates: {},
        nodes: {},
    }
}

Net.prototype.connect = function (name, node, options) {
    if (typeof name !== 'string') { throw new Error('Node name must be a string.') }
    if (name === '*') { throw new Error('Node name "*" cannot be set.') }
    if (name === '') { throw new Error('Node name "" cannot be set.') }
    if (!node || typeof node !== 'object') { throw new Error('Node must be an object.') }
    if (this._nodes[name]) {
        throw new Error('Node name "'.concat(name, '" is already used.'))
    }

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
}

function addHandler (handlers, params) {
    if (!params.to.gate) {
        return addGateHandler(handlers.nodes, params)
    }

    var gates = handlers.gates
    var gateNames = params.to.gate

    if (!Array.isArray(gateNames)) {
        gateNames = [gateNames]
    }

    for (var i = 0; i < gateNames.length; i++) {
        var gateName = gateNames[i]
        gates[gateName] = gates[gateName] || {}
        var gate = gates[gateName]
        addGateHandler(gate, params)
    }
}

function addGateHandler (gate, params) {
    var nodeNames = params.to.node || params.to
    if (!Array.isArray(nodeNames)) {
        nodeNames = [nodeNames]
    }

    for (var i = 0; i < nodeNames.length; i++) {
        var nodeName = nodeNames[i]
        addNodeHandler(gate, nodeName, params)
    }
}

function addNodeHandler (nodes, nodeName, params) {
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
    if (params.to.gate && params.as.gate) {
        throw new Error('sending a gate from a gate is forbidden.')
    }
    if (!params.topic) { throw new Error('"topic" is required.') }

    send(this._handlers, params)
}

function send (handlers, params) {
    var options = {}
    options.calls = new Map()

    var gateName = params.as.gate
    var nodeName = params.as.node || params.as

     if (!params.to.gate && gateName) {
        var gate = handlers.gates[gateName]
        if (!gate) { return }
        sendNode(gate[nodeName], params, options)
        sendNode(gate['*'], params, options)
        return
    }

    sendNode(handlers.nodes[nodeName], params, options)
    sendNode(handlers.nodes['*'], params, options)
}

function sendNode (nodes, params, options) {
    if (!nodes) { return }

    var destinationNames = params.to.gate || params.to.node || params.to

    if (destinationNames === '*') {
        destinationNames = Object.keys(nodes)
    }

    if (!Array.isArray(destinationNames)) {
        destinationNames = [destinationNames]
    }

    for (var i = 0; i < destinationNames.length; i++) {
        var destinationName = destinationNames[i]
        var destination = nodes[destinationName]
        sendDestination(destination, destinationName, params, options)
    }
}

function sendDestination (topics, nodeName, params, options) {
    if (!topics) { return }

    var handlers = topics[params.topic]

    fireHandlers(handlers, params.data, nodeName, params, options)
    fireHandlers(topics['*'], params.data, nodeName, params, options)
}

function fireHandlers (handlers, data, nodeName, params, options) {
    if (!handlers) { return }
    for (var i = 0; i < handlers.length; i++) {
        var handler = handlers[i]
        if (options.calls.has(handler)) { continue }

        var context = makeContext(params.as, nodeName, params.topic, params.success, params.error, handler)

        if (params.to.gate) {
            setImmediate(handler, {node: params.to.node, data: data}, context)
        } else {
            setImmediate(handler, data, context)
        }
        options.calls.set(handler, true)
    }
}

function makeContext (as, to, topic, success, error, caller) {
    var sender = {node: as.node || as}
    if (as.gate) { sender.gate = as.gate }
    var context = {
        sender: sender,
        topic: topic,
    }

    context.reply = makeResponseCtxReplyFn(as, to, topic, success, caller)
    context.refuse = makeResponseCtxErrorFn(as, to, topic, error, caller)

    return context
}

function makeResponseCtxReplyFn (as, to, topic, callback, caller) {
    return function (response, options) {
        options = options || {}
        var responseContext = makeContext(to, as, topic, options.success || caller, options.error, callback)
        setImmediate(callback, response, responseContext)
    }
}

function makeResponseCtxErrorFn (as, to, topic, callback, caller) {
    return function (error, options) {
        options = options || {}
        var responseContext = makeContext(to, as, topic, options.success || caller, options.error, callback)
        setImmediate(callback, error, responseContext)
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
}

function removeListener (handlers, params) {
    if (params.to.gate) {
        return removeGate(handlers.gates, params)
    }

    if (params.to) {
        return removeNode(handlers.nodes, params)
    }
}

function removeGate (gates, params) {
    if (!gates) { return }

    var gateNames = params.to.gate
    if (!Array.isArray(gateNames)) {
        gateNames = [gateNames]
    }

    for (var i = 0; i < gateNames.length; i++) {
        var gateName = gateNames[i]
        if (params.to.node) {
            removeNode(gates[gateName], params)
            if (isEmpty(gates[gateName])) {
                delete gates[gateName]
            }
            continue
        }
        delete gates[gateName]
    }
}

function removeNode (nodes, params) {
    if (!nodes) { return }

    var nodeNames = params.to.node || params.to

    if (!Array.isArray(nodeNames)) {
        nodeNames = [nodeNames]
    }

    for (var i = 0; i < nodeNames.length; i++) {
        var nodeName = nodeNames[i]
        if (params.topic) {
            var node = nodes[nodeName]
            if (node) {
                removetopic(node[params.as], params)
                if (isEmpty(node[params.as])) {
                    delete nodes[nodeName]
                }
            }
            continue
        }
        delete nodes[nodeName]
    }
}

function removetopic (topics, params) {
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
            if (handlers && !handlers.length) {
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
