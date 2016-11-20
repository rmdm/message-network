var Node = require('./Node')
var RestrictedMap = require('./util/RestrictedMap')
var errors = require('./errors')

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
}

Gate.prototype.listen = function (params) {
    params = params || {}
    var p = {
        to: params.to,
        topic: params.topic,
        handler: this.transfer.bind(this, {request: true}),
    }

    this.emit('listen', p)
    return this
}

Gate.prototype.transfer = function (options, data, context) {
    if (!data.node || !data.data) {
        return context.refuse(new Error('Bad data format.'))
    }
    var id = holdCallbacks(this, context)

    var params = {
        id: id,
        externalId: options.externalId,
        node: data.node,
        data: data.data,
        sender: context.sender,
        topic: context.topic,
    }

    params.request = options.request
    params.isReply = options.isReply
    params.isRefuse = options.isRefuse

    if (params.isRefuse) {
        if (params.data instanceof Error) {
            params.data = errors.serialize(params.data)
        } else {
            params.data = {data: params.data}
        }
    }

    this._transfer(params)

    return this
}

function holdCallbacks (gate, context) {
    var entry = gate._callbacks.add({
        reply: context.reply,
        refuse: context.refuse,
    })

    if (entry.substituted) {
        var disconnectedErr = new errors.DisconnectedError('Callbacks buffer overflow.', {remote: false})
        entry.substituted.refuse(disconnectedErr)
    }

    return entry.id
}

Gate.prototype._transfer = function (data) {
    throw new Error('"_transfer" method is not implimented.')
}

Gate.prototype.receive = function (data) {

    var params = {}
    params.success = this.transfer.bind(this, {externalId: data.id, isReply: true})
    params.error = this.transfer.bind(this, {externalId: data.id, isRefuse: true})

    if (data.request) {
        params.to = data.node
        params.topic = data.topic
        params.data = data.data
        params.as = data.sender
        this.send(params)
        return
    }

    var cbs = this._callbacks.remove(data.externalId)

    if (cbs) {
        if (data.isReply) {
            cbs.reply(data.data, params)
        } else if (data.isRefuse) {
            cbs.refuse(errors.deserialize(data.data), params)
        }
    } else {
        var disconnectedErr = new errors.DisconnectedError('Callbacks buffer overflow.', {remote: true})
        params.error(disconnectedErr)
    }

    return this
}
