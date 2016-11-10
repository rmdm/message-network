var Node = require('./Node')
var inherits = require('util').inherits

module.exports = Gate

var MAX_HELD_CB_COUNT = 1000

inherits(Gate, Node)

function Gate (options) {
    if (!(this instanceof Gate)) {
        return new Gate(options)
    }
    options = options || {}

    Node.call(this)

    var mapSize = options.MAX_HELD_CB_COUNT || MAX_HELD_CB_COUNT
    this._callbacks = new RestrictedMap(mapSize)

    this.uniqueId = makeUniqueId()
}

Gate.prototype.listen = function (params) {
    params = params || {}
    var p = {
        to: params.to,
        topic: params.topic,
        handler: this.transfer.bind(this, {request: true}),
    }
    return this.super('listen', [p])
}

Gate.prototype.transfer = function (options, data, context) {
    if (!data.node || !data.data) {
        return context.refuse(new Error('Bad data format.'))
    }
    var id = holdCallbacks(this, context)

    var params = {
        id: id,
        node: data.node,
        data: data.data,
        sender: context.sender,
        topic: context.topic,
        successHandler: !!context.success,
        errorHandler: !!context.error,
    }

    params.request = options.request
    params.isReply = options.isReply
    params.isRefuse = options.isRefuse

    this._transfer(params)

    return this
}

function holdCallbacks (gate, context) {
    var id = gate.uniqueId()

    var dropped = gate._callbacks.add(id, {
        reply: context.reply,
        refuse: context.refuse,
    })

    if (dropped) {
        dropped.refuse(new Error('Disconnected.'))
    }

    return id
}

Gate.prototype._transfer = function (data) {
    throw new Error('"_transfer" method is not implimented.')
}

Gate.prototype.receive = function (data) {

    var params = {}
    if (data.successHandler) {
        params.success = this.transfer.bind(this, {isReply: true})
    }
    if (data.errorHandler) {
        params.error = this.transfer.bind(this, {isRefuse: true})
    }

    if (data.request) {
        params.to = data.node
        params.topic = data.topic
        params.data = data.data
        this.send(params)
        return
    }

    var cbs = this._callbacks.remove(data.id)

    if (data.isReply) {
        cbs.reply(data.data, params)
    } else if (data.isRefuse) {
        cbs.refuse(data.data, params)
    }

    return this

}

Gate.prototype.super = function (methodName, args) {
    var super_ = this.constructor.super_.prototype
    if (!methodName) { return super_ }
    return super_[methodName].apply(this, args)
}

function makeUniqueId () {
    var count = 0
    return function () {
        return ++count
    }
}


function RestrictedMap (size) {
    this.maxSize = size > 1 ? size : 1
    this.map = new Map()
    this.first = null
    this.last = null
}

RestrictedMap.prototype.add = function (key, value) {
    var entry = {
        key: key,
        value: value,
        prev: this.last,
        next: null,
    }

    if (!this.last) {
        this.first = this.last = entry
    } else {
        this.last.next = entry
        entry.prev = this.last
        this.last = entry
    }

    var retVal = null

    if (this.map.size === this.maxSize) {
        retVal = this.remove(this.first.key)
    }

    this.map.set(key, entry)

    return retVal
}

RestrictedMap.prototype.remove = function (key) {
    var entry = this.map.get(key)
    this.map.delete(key)

    if (!entry) { return entry }

    if (entry.prev && entry.next) {
        entry.prev.next = entry.next
        entry.next.prev = entry.prev
    } else if (entry.prev) {
        entry.prev.next = null
        this.last = entry.prev
    } else if (entry.next) {
        entry.next.prev = null
        this.first = entry.next
    }

    return entry.value
}
