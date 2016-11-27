module.exports = HandlersMap

var errors = require('../errors')

function HandlersMap () {
    this.gates = new Map()
    this.nodes = new Map()
}

HandlersMap.prototype.add = function (params) {
    if (!params.as) { throw new Error('"as" is required.') }
    if (typeof params.as !== 'string') { throw new Error('"as" param of "listen" method must be a string.') }
    if (!params.to) { throw new Error('"to" is required.') }
    if (!params.topic) { throw new Error('"topic" is required.') }
    if (!params.handler) { throw new Error('"handler" is required.') }
    return addHandlers(this, params)
}

function addHandlers (map, params) {
    var sources = params.to

    if (!Array.isArray(sources)) {
        sources = [sources]
    }

    for (var source of sources) {
        addHandlersOnSource(map, source, params)
    }
}

function addHandlersOnSource (map, source, params) {
    var nodeNames = source.node || source

    if (!source.gate) {
        return addHandlersOnGate(map.nodes, null, nodeNames, params)
    }

    var gates = map.gates
    var gateNames = source.gate

    if (!Array.isArray(gateNames)) {
        gateNames = [gateNames]
    }

    for (var gateName of gateNames) {
        if (!gates.has(gateName)) {
            gates.set(gateName, new Map())
        }
        var gate = gates.get(gateName)
        addHandlersOnGate(gate, gateName, nodeNames, params)
    }
}

function addHandlersOnGate (gate, gateName, nodeNames, params) {
    if (!Array.isArray(nodeNames)) {
        nodeNames = [nodeNames]
    }

    for (var nodeName of nodeNames) {
        addHandlersOnNode(gate, gateName, nodeName, params)
    }
}

function addHandlersOnNode (nodes, gateName, nodeName, params) {

    if (!nodes.has(nodeName)) {
        nodes.set(nodeName, new Map())
    }
    var destinations = nodes.get(nodeName)

    var listenerNodeName = params.as

    if (!destinations.has(listenerNodeName)) {
        destinations.set(listenerNodeName, new Map())
    }
    var topics = destinations.get(listenerNodeName)

    var topicNames = params.topic

    if (!Array.isArray(topicNames)) {
        topicNames = [topicNames]
    }

    for (var topicName of topicNames) {
        addHandlersOnTopic(topics, topicName, params)
    }
}

function addHandlersOnTopic (topics, topicName, params) {
    if (!topics.has(topicName)) {
        topics.set(topicName, new Set())
    }
    var handlers = topics.get(topicName)

    var topicHandlers = params.handler
    if (!Array.isArray(topicHandlers)) {
        topicHandlers = [topicHandlers]
    }

    for (var handler of topicHandlers) {
        handlers.add(handler)
    }
}

HandlersMap.prototype.exec = function (params, options) {
    if (!params.as) { throw new Error('"as" is required.') }
    if (!params.to) { throw new Error('"to" is required.') }
    if (!params.topic) { throw new Error('"topic" is required.') }

    checkDestinations(params.to, params.as)

    var handlers = getHandlers(this, params)

    for (var i = 0; i < handlers.length; i++) {
        var handler = handlers[i]
        fireHandlers(handler.handlers, handler.gate, handler.node, params, options)
    }
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

function getHandlers (map, params) {

    var gateName = params.as.gate
    var gate = map.gates.get(gateName)

    if (!gateName) {
        gate = map.nodes
    }

    var allGateHandlers = getHandlersOnSourceGate(map.gates.get('*'), params)
    var sourceGateHandlers = getHandlersOnSourceGate(gate, params)

    return merge(allGateHandlers, sourceGateHandlers)
}

function getHandlersOnSourceGate (gate, params) {
    if (!gate) { return [] }

    var nodeName = params.as.node || params.as

    var allNodeHandlers = getHandlersOnSourceNode(gate.get('*'), params)
    var sourceNodeHandlers = getHandlersOnSourceNode(gate.get(nodeName), params)

    return merge(allNodeHandlers, sourceNodeHandlers)
}

function getHandlersOnSourceNode (node, params) {
    if (!node) { return [] }

    var destinations = normalizeDestinations(params.to)

    var result = []

    for (var destination of destinations) {
        var destinationHandlers = getHandlersOnDestination(node, destination, params)
        merge(result, destinationHandlers)
    }

    return result
}

function normalizeDestinations (destinations) {
    if (!Array.isArray(destinations)) { return [destinations]}

    var nodes = {}
    var gates = {}

    var starFullGates = []
    var starLessGates = []

    for (var destination of destinations) {
        if (destination == null) { continue }
        if (!destination.gate) {
            nodes[destination.node || destination] = true
        } else {
            var destinationGates = destination.gate
            if (!Array.isArray(destinationGates)) {
                destinationGates = [destinationGates]
            }

            var hasStar = false
            for (var gate of destinationGates) {
                if (gate === '*') {
                    hasStar = true
                    break
                }
            }
            if (hasStar) {
                starFullGates.push({
                    gate: ['*'],
                    node: destination.node,
                })
            } else {
                starLessGates.push({
                    gate: destinationGates,
                    node: destination.node,
                })
            }
        }
    }

    var result = []

    if (nodes['*']) {
        result = ['*']
    } else {
        result = Object.keys(nodes)
    }

    for (var gate of starFullGates) {
        var gateNodes = gate.node
        if (!Array.isArray(gate.node)) {
            gateNodes = [gateNodes]
        } else {
            for (var node of gate.node) {
                gates['*'] = gates['*'] || {}
                gates['*'][node] = true
            }
        }
    }

    for (var gate of starLessGates) {
        for (var gateName of gate.gate) {
            var gateNodes = gate.node
            if (!Array.isArray(gateNodes)) {
                gateNodes = [gateNodes]
            } else {
                for (var node of gateNodes) {
                    if (gates['*'] && gates['*'][node]) { continue }
                    gates[gateName] = gates[gateName] || {}
                    gates[gateName][node] = true
                }
            }
        }
    }

    for (var gateName in gates) {
        var gate = gates[gateName]
        var nodeNames = Object.keys(gate)
        result.push({
            gate: gateName,
            node: nodeNames,
        })
    }

    return result
}

function getHandlersOnDestination (destinations, destination, params) {

    var gateNames = destination.gate
    var nodeNames = destination.node || destination

    if (!gateNames) {
        return getHandlersOnDestinationGate(destinations, null, nodeNames, params)
    }

    if (gateNames === '*') {
        gateNames = destinations.keys()
    } else if (!Array.isArray(gateNames)) {
        gateNames = [gateNames]
    }

    var result = []

    for (var gateName of gateNames) {
        var destinationGateHandlers =
            getHandlersOnDestinationGate(destinations, gateName, nodeNames, params)
        merge(result, destinationGateHandlers)
    }

    return result

}

function getHandlersOnDestinationGate (destinations, gateName, nodeNames, params) {

    if (gateName) {
        return getHandlersOnDestinationNode(destinations.get(gateName), gateName, nodeNames, params)
    }

    if (nodeNames === '*') {
        nodeNames = destinations.keys()
    } else if (!Array.isArray(nodeNames)) {
        nodeNames = [nodeNames]
    }

    var result = []

    for (var nodeName of nodeNames) {
        var destinationNodeHandlers =
            getHandlersOnDestinationNode(destinations.get(nodeName), gateName, nodeName, params)
        merge(result, destinationNodeHandlers)
    }

    return result

}

function getHandlersOnDestinationNode (topics, gateName, nodeName, params) {
    if (!topics) { return [] }

    var handlersSet = mergeSets(topics.get('*'), topics.get(params.topic))

    return getTopicHandlers(handlersSet, gateName, nodeName)
}

function getTopicHandlers (handlers, gateName, nodeName) {
    if (!handlers) { return []}

    return [
        {
            handlers: handlers.values(),
            gate: gateName,
            node: nodeName,
        }
    ]
}

function merge (arr1, arr2) {
    Array.prototype.push.apply(arr1, arr2)
    return arr1
}

function mergeSets (set1, set2) {
    var result = new Set()
    if (set1) {
        for (var handler of set1) {
            result.add(handler)
        }
    }
    if (set2) {
        for (var handler of set2) {
            result.add(handler)
        }
    }
    return result
}

function fireHandlers (handlers, gateName, nodeName, params, options) {
    if (!(gateName && options.gates[gateName] || !gateName && !options.gates[nodeName])) {
        return
    }

    for (var handler of handlers) {

        var as = { node: nodeName }
        if (gateName) { as.gate = gateName }

        var to = { node: params.as.node || params.as }
        if (params.as.gate) { to.gate = params.as.gate }

        var fn = makeContextFn(handler, handler, null, {
            as: as,
            to: to,
            topic: params.topic,
            nodes: options.nodes,
        })

        fn(params.data, {
            success: params.success,
            error: params.error,
            options: {
                timeout: params.options ? params.options.timeout : 0,
            },
        })

    }
}

var noop = function () {}

function makeContextFn (callback, success, error, params, transformData) {
    return function (data, options) {
        options = options || {}

        if (params.called) { return }
        params.called = true

        var as = params.as
        var to = params.to

        var ctxNode = params.nodes[as.gate || as.node]
        var dstNode = params.nodes[to.gate || to.node]

        if (!ctxNode || !dstNode) {
            if (options.error) {
                var noopContext = makeContext(noop, noop, {
                    as: as,
                    to: to,
                    topic: params.topic,
                })
                var disconnectedError = new errors.DisconnectedError('Node disconnected', {remote: !ctxNode})
                options.error(disconnectedError, noopContext)
            }
            return
        }

        var reply = options.success || params.success || noop
        var refuse = options.error || params.error || noop

        var context = makeContext(reply, refuse, {
            as: params.to,
            to: params.as,
            topic: params.topic,
            nodes: params.nodes,
            options: options.options,
            success: success,
            error: error,
        })

        if (typeof transformData === 'function') {
            data = transformData(data)
        }

        if (as.gate) {
            data = {node: as.node, data: data}
        }

        setImmediate(callback.bind(ctxNode), data, context)
    }
}

function makeContext (success, error, params) {

    var context = {
        sender: params.as,
        topic: params.topic,
    }

    params = Object.assign({}, params, {called: false})

    context.reply = makeContextFn(success, success, error, params)
    context.refuse = makeContextFn(error, success, error, params, toError)

    var options = params.options || {}

    if (options.timeout && !isNaN(options.timeout)) {
        setTimeout(function () {
            context.refuse(new errors.TimeoutError('Timeout expired.', {timeout: options.timeout}))
        }, options.timeout)
    }

    return context

}

function toError (data) {
    if (!(data instanceof errors.BaseError)) {
        if (data instanceof Error) {
            data = errors.deserialize(data)
        } else {
            data = new errors.BaseError('Refused.', data)
        }
    }
    return data
}

var removeParamsDeps = {
    'handler': ['topic'],
    'topic': ['to'],
    'to': ['as'],
}

HandlersMap.prototype.remove = function (params) {
    checkParamsDeps(params, removeParamsDeps)
    return removeHandlers(this, params)
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

function removeHandlers (map, params) {
    var sources = params.to

    if (!Array.isArray(sources)) {
        sources = [sources]
    }

    for (var source of sources) {
        removeSourceHandlers(map, source, params)
    }
}

function removeSourceHandlers (map, source, params) {

    if (!source.gate) {
        var nodeNames = source.node || source
        return removeGateHandlers(map.nodes, null, nodeNames, params)
    }

    var nodeNames = source.node

    var gates = map.gates
    var gateNames = source.gate

    if (!Array.isArray(gateNames)) {
        gateNames = [gateNames]
    }

    for (var gateName of gateNames) {
        var gate = gates.get(gateName)
        if (!gate) { continue }
        if (nodeNames) {
            removeGateHandlers(gate, gateName, nodeNames, params)
            if (gate.size) { continue }
        }
        gates.delete(gateName)
    }
}

function removeGateHandlers (nodes, gateName, nodeNames, params) {
    if (!nodes) { return }

    if (!Array.isArray(nodeNames)) {
        nodeNames = [nodeNames]
    }

    for (var nodeName of nodeNames) {
        var node = nodes.get(nodeName)
        if (!node) { continue }
        if (params.topic) {
            removeDestinationHandler(node, params)
            if (node.size) { continue }
        }
        nodes.delete(nodeName)
    }
}

function removeDestinationHandler (node, params) {
    var destination = node.get(params.as)
    removeNodeHandlers(destination, params)
    if (!destination.size) {
        node.delete(params.as)
    }
}

function removeNodeHandlers (topics, params) {
    if (!topics) { return }

    var topicNames = params.topic

    if (!Array.isArray(topicNames)) {
        topicNames = [topicNames]
    }

    for (var topicName of topicNames) {
        var handlers = topics.get(topicName)
        if (!handlers) { continue }
        if (params.handler) {
            removeTopicHandlers(handlers, params)
            if (handlers.size) { continue }
        }
        topics.delete(topicName)
    }
}

function removeTopicHandlers (handlers, params) {
    if (!handlers) { return }

    var topicHandlers = params.handler

    if (!Array.isArray(topicHandlers)) {
        topicHandlers = [topicHandlers]
    }

    for (var handler of topicHandlers) {
        handlers.delete(handler)
    }

}
