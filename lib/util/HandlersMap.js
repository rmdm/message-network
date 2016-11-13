module.exports = HandlersMap

function HandlersMap () {
    this.gates = new Map()
    this.nodes = new Map()
}

HandlersMap.prototype.add = function (params) {
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

HandlersMap.prototype.get = function (params) {
    return getHandlers(this, params)
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

    var destinations = params.to

    if (!Array.isArray(destinations)) {
        destinations = [destinations]
    }

    var result = []

    for (var destination of destinations) {
        var destinationHandlers = getHandlersOnDestination(node, destination, params)
        merge(result, destinationHandlers)
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

    var allTopicHandlers = getTopicHandlers(topics.get('*'), gateName, nodeName)
    var topicHandlers = getTopicHandlers(topics.get(params.topic), gateName, nodeName)

    return merge(allTopicHandlers, topicHandlers)
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

HandlersMap.prototype.remove = function (params) {
    return removeHandlers(this, params)
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
