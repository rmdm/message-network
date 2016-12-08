'use strict'

import * as errors from '../errors'

export default HandlersMap

function HandlersMap () {
    this.gates = new Map()
    this.nodes = new Map()
}

HandlersMap.prototype.add = function (params) {
    if (!params.as) { throw new Error('"as" is required.') }
    if (typeof params.as !== 'string') { throw new Error('"as" param of "listen" method must be a string.') }
    if (!params.to) { throw new Error('"to" is required.') }
    if (!params.topic) { throw new Error('"topic" is required.') }
    if (!params.success) { throw new Error('"success" is required.') }
    return addHandlers(this, params)
}

function addHandlers (map, params) {
    var sources = params.to

    if (!Array.isArray(sources)) {
        sources = [sources]
    }

    for (const source of sources) {
        addHandlersOnSource(map, source, params)
    }
}

function addHandlersOnSource (map, source, params) {
    const nodeNames = source.node || source

    if (!source.gate) {
        return addHandlersOnGate(map.nodes, null, nodeNames, params)
    }

    const gates = map.gates
    var gateNames = source.gate

    if (!Array.isArray(gateNames)) {
        gateNames = [gateNames]
    }

    for (const gateName of gateNames) {
        if (!gates.has(gateName)) {
            gates.set(gateName, new Map())
        }
        const gate = gates.get(gateName)
        addHandlersOnGate(gate, gateName, nodeNames, params)
    }
}

function addHandlersOnGate (gate, gateName, nodeNames, params) {
    if (!Array.isArray(nodeNames)) {
        nodeNames = [nodeNames]
    }

    for (const nodeName of nodeNames) {
        addHandlersOnNode(gate, gateName, nodeName, params)
    }
}

function addHandlersOnNode (nodes, gateName, nodeName, params) {

    if (!nodes.has(nodeName)) {
        nodes.set(nodeName, new Map())
    }
    const destinations = nodes.get(nodeName)

    const listenerNodeName = params.as

    if (!destinations.has(listenerNodeName)) {
        destinations.set(listenerNodeName, new Map())
    }
    const topics = destinations.get(listenerNodeName)

    var topicNames = params.topic

    if (!Array.isArray(topicNames)) {
        topicNames = [topicNames]
    }

    for (const topicName of topicNames) {
        addHandlersOnTopic(topics, topicName, params)
    }
}

function addHandlersOnTopic (topics, topicName, params) {
    if (!topics.has(topicName)) {
        topics.set(topicName, new Map())
    }
    const handlers = topics.get(topicName)

    var successHandler = params.success
    var errorHandler = params.error

    handlers.set(successHandler, errorHandler)
}

HandlersMap.prototype.exec = function (params, options) {
    if (!params.as) { throw new Error('"as" is required.') }
    if (!params.to) { throw new Error('"to" is required.') }
    if (!params.topic) { throw new Error('"topic" is required.') }

    checkDestinations(params.to, params.as)

    const handlers = getHandlers(this, params)

    for (const handler of handlers) {
        fireHandlers(handler.handlers, handler.gate, handler.node, params, options)
    }
}

function checkDestinations (destinations, source) {
    if (!Array.isArray(destinations)) {
        destinations = [destinations]
    }

    for (const destination of destinations) {
        if (destination.gate && source.gate) {
            throw new Error('sending to a gate from a gate is forbidden.')
        }
    }
}

function getHandlers (map, params) {

    const gateName = params.as.gate
    var gate = map.gates.get(gateName)

    if (!gateName) {
        gate = map.nodes
    }

    const allGateHandlers = getHandlersOnSourceGate(map.gates.get('*'), params)
    const sourceGateHandlers = getHandlersOnSourceGate(gate, params)

    return merge(allGateHandlers, sourceGateHandlers)
}

function getHandlersOnSourceGate (gate, params) {
    if (!gate) { return [] }

    const nodeName = params.as.node || params.as

    const allNodeHandlers = getHandlersOnSourceNode(gate.get('*'), params)
    const sourceNodeHandlers = getHandlersOnSourceNode(gate.get(nodeName), params)

    return merge(allNodeHandlers, sourceNodeHandlers)
}

function getHandlersOnSourceNode (node, params) {
    if (!node) { return [] }

    const destinations = normalizeDestinations(params.to)

    const result = []

    for (const destination of destinations) {
        const destinationHandlers = getHandlersOnDestination(node, destination, params)
        merge(result, destinationHandlers)
    }

    return result
}

function normalizeDestinations (destinations) {
    if (!Array.isArray(destinations)) { return [destinations]}

    const nodes = {}
    const gates = {}

    const starFullGates = []
    const starLessGates = []

    for (const destination of destinations) {
        if (destination == null) { continue }
        if (!destination.gate) {
            nodes[destination.node || destination] = true
        } else {
            var destinationGates = destination.gate
            if (!Array.isArray(destinationGates)) {
                destinationGates = [destinationGates]
            }

            var hasStar = false
            for (const gate of destinationGates) {
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

    for (const gate of starFullGates) {
        var gateNodes = gate.node
        if (!Array.isArray(gate.node)) {
            gateNodes = [gateNodes]
        } else {
            for (const node of gate.node) {
                gates['*'] = gates['*'] || {}
                gates['*'][node] = true
            }
        }
    }

    for (const gate of starLessGates) {
        for (const gateName of gate.gate) {
            var gateNodes = gate.node
            if (!Array.isArray(gateNodes)) {
                gateNodes = [gateNodes]
            } else {
                for (const node of gateNodes) {
                    if (gates['*'] && gates['*'][node]) { continue }
                    gates[gateName] = gates[gateName] || {}
                    gates[gateName][node] = true
                }
            }
        }
    }

    for (const gateName in gates) {
        const gate = gates[gateName]
        const nodeNames = Object.keys(gate)
        result.push({
            gate: gateName,
            node: nodeNames,
        })
    }

    return result
}

function getHandlersOnDestination (destinations, destination, params) {

    var gateNames = destination.gate
    const nodeNames = destination.node || destination

    if (!gateNames) {
        return getHandlersOnDestinationGate(destinations, null, nodeNames, params)
    }

    if (gateNames === '*') {
        gateNames = destinations.keys()
    } else if (!Array.isArray(gateNames)) {
        gateNames = [gateNames]
    }

    const result = []

    for (const gateName of gateNames) {
        const destinationGateHandlers =
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

    const result = []

    for (const nodeName of nodeNames) {
        const destinationNodeHandlers =
            getHandlersOnDestinationNode(destinations.get(nodeName), gateName, nodeName, params)
        merge(result, destinationNodeHandlers)
    }

    return result

}

function getHandlersOnDestinationNode (topics, gateName, nodeName, params) {
    if (!topics) { return [] }

    const handlersSet = mergeMaps(topics.get('*'), topics.get(params.topic))

    return getTopicHandlers(handlersSet, gateName, nodeName)
}

function getTopicHandlers (handlers, gateName, nodeName) {
    if (!handlers) { return []}

    return [
        {
            handlers: handlers,
            gate: gateName,
            node: nodeName,
        }
    ]
}

function merge (arr1, arr2) {
    Array.prototype.push.apply(arr1, arr2)
    return arr1
}

function mergeMaps (map1, map2) {
    const result = new Map()
    if (map1) {
        for (const [success, error] of map1) {
            result.set(success, error)
        }
    }
    if (map2) {
        for (const [success, error] of map2) {
            result.set(success, error)
        }
    }
    return result
}

function fireHandlers (handlers, gateName, nodeName, params, options) {
    if (!(gateName && options.gates[gateName] || !gateName && !options.gates[nodeName])) {
        return
    }

    for (const [success, error] of handlers) {

        const as = { node: nodeName }
        if (gateName) { as.gate = gateName }

        const to = { node: params.as.node || params.as }
        if (params.as.gate) { to.gate = params.as.gate }


        const ctxNode = options.nodes[as.gate || as.node]
        const dstNode = options.nodes[to.gate || to.node]

        const fn = makeContextFn(success, success, error, {
            as: as,
            to: to,
            topic: params.topic,
            nodes: options.nodes,
            ctxNode: ctxNode,
            dstNode: dstNode,
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

const noop = function () {}

function makeContextFn (callback, success, error, params, transformData) {
    return function (data, options) {
        options = options || {}

        if (params.called) { return }
        params.called = true

        const as = params.as
        const to = params.to

        const ctxNode = params.nodes[as.gate || as.node]
        const dstNode = params.nodes[to.gate || to.node]

        if (!ctxNode || !dstNode) {
            if (options.error) {
                const noopContext = makeContext(noop, noop, {
                    as: as,
                    to: to,
                    topic: params.topic,
                })
                const disconnectedError = new errors.DisconnectedError('Node disconnected', {remote: !ctxNode})
                setImmediate(options.error.bind(params.dstNode), disconnectedError, noopContext)
            }
            return
        }

        const reply = options.success || params.success || noop
        const refuse = options.error || params.error || noop

        const context = makeContext(reply, refuse, {
            as: params.to,
            to: params.as,
            topic: params.topic,
            nodes: params.nodes,
            options: options.options,
            success: success,
            error: error,
            ctxNode: params.dstNode,
            dstNode: params.ctxNode,
        })

        if (typeof transformData === 'function') {
            data = transformData(data)
        }

        if (as.gate) {
            data = {node: as.node, data: data}
        }

        setImmediate(callback.bind(params.ctxNode), data, context)
    }
}

function makeContext (success, error, params) {

    const context = {
        sender: params.as,
        topic: params.topic,
    }

    params = Object.assign({}, params, {called: false})

    context.reply = makeContextFn(success, success, error, params)
    context.refuse = makeContextFn(error, success, error, params, toError)

    const options = params.options || {}

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

const removeParamsDeps = {
    'success': ['topic'],
    'topic': ['to'],
    'to': ['as'],
}

HandlersMap.prototype.remove = function (params) {
    checkParamsDeps(params, removeParamsDeps)
    return removeHandlers(this, params)
}

function checkParamsDeps(params, deps) {
    for (const k in params) {
        var keyDeps = deps[k]
        if (!keyDeps) { continue }

        var found = false

        for (const keyDep of keyDeps) {
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

    for (const source of sources) {
        removeSourceHandlers(map, source, params)
    }
}

function removeSourceHandlers (map, source, params) {

    if (!source.gate) {
        const nodeNames = source.node || source
        return removeGateHandlers(map.nodes, null, nodeNames, params)
    }

    const nodeNames = source.node

    const gates = map.gates
    var gateNames = source.gate

    if (!Array.isArray(gateNames)) {
        gateNames = [gateNames]
    }

    for (const gateName of gateNames) {
        const gate = gates.get(gateName)
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

    for (const nodeName of nodeNames) {
        const node = nodes.get(nodeName)
        if (!node) { continue }
        if (params.topic) {
            removeDestinationHandler(node, params)
            if (node.size) { continue }
        }
        nodes.delete(nodeName)
    }
}

function removeDestinationHandler (node, params) {
    const destination = node.get(params.as)
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

    for (const topicName of topicNames) {
        const handlers = topics.get(topicName)
        if (!handlers) { continue }
        if (params.success) {
            removeTopicHandlers(handlers, params)
            if (handlers.size) { continue }
        }
        topics.delete(topicName)
    }
}

function removeTopicHandlers (handlers, params) {
    if (!handlers) { return }

    var topicHandlers = params.success

    if (!Array.isArray(topicHandlers)) {
        topicHandlers = [topicHandlers]
    }

    for (const topicHandler of topicHandlers) {
        handlers.delete(topicHandler)
    }
}
