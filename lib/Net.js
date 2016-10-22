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
    if (!params.node) { throw new Error('"node" is required.') }
    if (!params.event) { throw new Error('"event" is required.') }
    if (!params.handler) { throw new Error('"handler" is required.') }

    if (!params.gate) {
        return addGateHandler(this._handlers.nodes, params)
    }

    var gates = this._handlers.gates
    var gateNames = params.gate

    if (!Array.isArray(params.gate)) {
        gateNames = [params.gate]
    }

    for (var i = 0; i < gateNames.length; i++) {
        var gateName = gateNames[i]
        gates[gateName] = gates[gateName] || {}
        var gate = gates[gateName]
        addGateHandler(gate, params)
    }
}

function addGateHandler (gate, params) {
    var nodeNames = params.node
    if (!Array.isArray(params.node)) {
        nodeNames = [params.node]
    }

    for (var i = 0; i < nodeNames.length; i++) {
        var nodeName = nodeNames[i]
        addNodeHandler(gate, params, nodeName)
    }
}

function addNodeHandler (nodes, params, nodeName) {
    nodes[nodeName] = nodes[nodeName] || {}
    var destinations = nodes[nodeName]

    var listenerNodeName = params.as

    destinations[listenerNodeName] = destinations[listenerNodeName] || {}
    var events = destinations[listenerNodeName]

    var eventNames = params.event

    if (!Array.isArray(eventNames)) {
        eventNames = [eventNames]
    }

    for (var i = 0; i < eventNames.length; i++) {
        var eventName = eventNames[i]
        addEventHandler(events, params, eventName)
    }
}

function addEventHandler (events, params, eventName) {
    events[eventName] = events[eventName] || []
    var handlers = events[eventName]

    var eventHandlers = params.handler
    if (!Array.isArray(eventHandlers)) {
        eventHandlers = [eventHandlers]
    }

    Array.prototype.push.apply(handlers, eventHandlers)
}

Net.prototype.notify = function (params) {
    if (!params.as) { throw new Error('"as" is required.') }
    if (!params.node) { throw new Error('"node" is required.') }
    if (!params.event) { throw new Error('"event" is required.') }

    if (!params.gate) {
        return notifyGate(this._handlers.nodes, params)
    }

    var gates = this._handlers.gates
    var gateNames = params.gate

    if (!Array.isArray(params.gate)) {
        gateNames = [params.gate]
    }

    for (var i = 0; i < gateNames.length; i++) {
        var gateName = gateNames[i]
        var gate = gates[gateName]
        if (gate) {
            notifyGate(gate, params)
        }
    }
}

function notifyGate (gate, params) {
    var nodeNames = params.node
    if (!Array.isArray(params.node)) {
        nodeNames = [params.node]
    }

    for (var i = 0; i < nodeNames.length; i++) {
        var nodeName = nodeNames[i]
        notifyNode(gate, params, nodeName)
    }
}

function notifyNode (nodes, params, nodeName) {
    if (!nodes[params.as]) { return }

    var destinations = nodes[params.as] || {}
    if (!destinations[nodeName]) { return }

    var events = destinations[nodeName] || {}
    if (!events[params.event]) { return }

    var handlers = events[params.event]

    var context = {
        sender: params.as,
        event: params.event,
    }

    if (events['*']) {
        handlers = diff(handlers, events['*'])
        fireHandlers(events['*'], params.data, context)
    }

    fireHandlers(handlers, params.data, context)
}

function fireHandlers (handlers, data, context) {
    for (var i = 0; i < handlers.length; i++) {
        handlers[i](data, context)
    }
}

var stopListenParamsDeps = {
    'handler': ['event'],
    'event': ['node'],
    'node': ['gate', 'as'],
    'gate': ['as'],
}

Net.prototype.stopListen = function (params) {
    checkParamsDeps(params, stopListenParamsDeps)

    if (params.gate) {
        return removeGate(this._handlers.gates, params)
    }

    if (params.node) {
        return removeNode(this._handlers.nodes, params)
    }
}

function removeGate (gates, params) {
    if (!gates) { return }

    var gateNames = params.gate
    if (!Array.isArray(gateNames)) {
        gateNames = [gateNames]
    }

    for (var i = 0; i < gateNames.length; i++) {
        var gateName = gateNames[i]
        if (params.node) {
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

    var nodeNames = params.node

    if (!Array.isArray(nodeNames)) {
        nodeNames = [nodeNames]
    }

    for (var i = 0; i < nodeNames.length; i++) {
        var nodeName = nodeNames[i]
        if (params.event) {
            var node = nodes[nodeName]
            if (node) {
                removeEvent(node[params.as], params)
                if (isEmpty(node[params.as])) {
                    delete nodes[nodeName]
                }
            }
            continue
        }
        delete nodes[nodeName]
    }
}

function removeEvent (events, params) {
    if (!events) { return }

    var eventNames = params.event

    if (!Array.isArray(eventNames)) {
        eventNames = eventNames
    }

    for (var i = 0; i < eventNames.length; i++) {
        var eventName = eventNames[i]
        if (params.handler) {
            var handlers = events[eventName]
            removeHandler(handlers, params)
            if (handlers && !handlers.length) {
                delete events[eventName]
            }
            continue
        }
        delete events[eventName]
    }
}

function removeHandler (handlers, params) {
    if (!handlers) { return }

    var eventHandlers = params.handler

    if (!Array.isArray(eventHandlers)) {
        eventHandlers = [eventHandlers]
    }

    var tmpHandlers = []

    for (var i = 0; i < handlers.length; i++) {
        var handler = handlers[i]
        var handlerListed = false

        for (var j = 0; j < eventHandlers.length; j++) {
            var eventHandler = eventHandlers[i]
            if (eventHandler === handler) {
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

function diff (arr1, arr2) {
    var result = []
    for (var i = 0; i < arr1.length; i++) {
        var exclude = false
        for (var j = 0; j < arr2.length; j++) {
            if (arr1[i] === arr2[j]) {
                exclude = true
                break
            }
        }
        if (!exclude) {
            result.push(arr1[i])
        }
    }
    return result
}

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
