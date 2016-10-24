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
    this._actionHandlers = {
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
    if (!params.node) { throw new Error('"node" is required.') }
    if (!params.event) { throw new Error('"event" is required.') }
    if (!params.handler) { throw new Error('"handler" is required.') }

    addHandler(this._handlers, params)
}

Net.prototype.action = function (params) {
    if (!params.as) { throw new Error('"as" is required.') }
    if (!params.node) { throw new Error('"node" is required.') }
    if (!params.action) { throw new Error('"action" is required.') }
    if (!params.handler) { throw new Error('"handler" is required.') }

    addHandler(this._actionHandlers, {
        as: params.as,
        gate: params.gate,
        node: params.node,
        event: params.action,
        handler: params.handler,
    })
}

function addHandler (handlers, params) {
    if (!params.gate) {
        return addGateHandler(handlers.nodes, params)
    }

    var gates = handlers.gates
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
        addNodeHandler(gate, nodeName, params)
    }
}

function addNodeHandler (nodes, nodeName, params) {
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
        addEventHandler(events, eventName, params)
    }
}

function addEventHandler (events, eventName, params) {
    events[eventName] = events[eventName] || []
    var handlers = events[eventName]

    var eventHandlers = params.handler
    if (!Array.isArray(eventHandlers)) {
        eventHandlers = [eventHandlers]
    }

    Array.prototype.push.apply(handlers, eventHandlers)
}

Net.prototype.notify = function (params) {
    if (!params.event) { throw new Error('"event" is required.') }

    notify(this._handlers, params, {request: false})
}

Net.prototype.request = function (params) {
    if (!params.action) { throw new Error('"event" is required.') }
    if (!params.callback) { throw new Error('"callback" is required.') }

    notify(this._actionHandlers, {
        as: params.as,
        gate: params.gate,
        node: params.node,
        event: params.action,
        data: params.data,
        handler: params.handler,
        callback: params.callback,
    }, {request: true})
}

function notify (handlers, params, options) {
    if (!params.as) { throw new Error('"as" is required.') }
    if (!params.node) { throw new Error('"node" is required.') }
    if (params.gate && params.as.gate) {
        throw new Error('notifying a gate from a gate is forbidden.')
    }

    options.calls = new Map()

    var gateName = params.as.gate
    var nodeName = params.as.node || params.as

     if (!params.gate && gateName) {
        var gate = handlers.gates[gateName] || {}
        notifyNode(gate[nodeName], gateName, params, options)
        notifyNode(gate['*'], gateName, params, options)
        return
    }

    notifyNode(handlers.nodes[nodeName], null, params, options)
    notifyNode(handlers.nodes['*'], null, params, options)
}

function notifyNode (nodes, gateName, params, options) {
    if (!nodes) { return }

    var destinationNames = params.gate || params.node

    if (destinationNames === '*') {
        destinationNames = Object.keys(nodes)
    }

    if (!Array.isArray(destinationNames)) {
        destinationNames = [destinationNames]
    }

    for (var i = 0; i < destinationNames.length; i++) {
        var destinationName = destinationNames[i]
        var destination = nodes[destinationName]
        notifyDestination(destination, gateName, destinationName, params, options)
    }
}

function notifyDestination (events, gateName, nodeName, params, options) {
    if (!events) { return }

    var handlers = events[params.event]

    var sender = {node: params.as.node || params.as}
    if (gateName) { sender.gate = gateName }
    var context = {
        sender: sender,
        event: params.event,
    }

    if (options.request) {
        context.reply = makeResponseCtxReplyFn(gateName, nodeName, params.event, params.callback)
        context.error = makeResponseCtxErrorFn(gateName, nodeName, params.event, params.callback)
    }

    fireHandlers(handlers, params.data, context, params, options)
    fireHandlers(events['*'], params.data, context, params, options)
}

function makeResponseCtxReplyFn (gateName, nodeName, event, callback) {
    return function (response) {
        var sender = { node: nodeName }
        if (gateName) { sender.gate = gateName }
        var responseContext = {
            sender: sender,
            action: event,
        }
        callback(null, response, responseContext)
    }
}

function makeResponseCtxErrorFn (gateName, nodeName, params) {
    return function (error) {
        var sender = { node: nodeName }
        if (gateName) { sender.gate = gateName }
        var responseContext = {
            sender: sender,
            action: params.event,
        }
        params.callback(error, null, responseContext)
    }
}

function fireHandlers (handlers, data, context, params, options) {
    if (!handlers) { return }
    for (var i = 0; i < handlers.length; i++) {
        var handler = handlers[i]
        if (options.calls.has(handler)) { continue }
        if (params.gate) {
            handler({node: params.node, data: data}, context)
        } else {
            handler(data, context)
        }
        options.calls.set(handler, true)
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

    removeListener(this._handlers, params)
}

var cancelActionParamsDeps = {
    'handler': ['action'],
    'action': ['node'],
    'node': ['gate', 'as'],
    'gate': ['as'],
}

Net.prototype.cancelAction = function (params) {
    checkParamsDeps(params, cancelActionParamsDeps)

    removeListener(this._actionHandlers, {
        as: params.as,
        gate: params.gate,
        node: params.node,
        event: params.action,
        handler: params.handler,
    })
}

function removeListener (handlers, params) {
    if (params.gate) {
        return removeGate(handlers.gates, params)
    }

    if (params.node) {
        return removeNode(handlers.nodes, params)
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
        eventNames = [eventNames]
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
            var eventHandler = eventHandlers[j]
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
