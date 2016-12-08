'use strict'

import { inherits } from 'util'
import Node from './Node'

import RestrictedMap from './util/RestrictedMap'
import * as errors from './errors'

export default Gate

const MAX_HELD_CB_COUNT = 1000

inherits(Gate, Node)

function Gate (options) {
    if (!(this instanceof Gate)) {
        return new Gate(options)
    }
    options = options || {}

    Node.call(this)

    const mapSize = options.MAX_HELD_CB_COUNT || MAX_HELD_CB_COUNT
    this._callbacks = new RestrictedMap(mapSize)
}

Gate.prototype.listen = function (params) {
    params = params || {}
    const p = {
        to: params.to,
        topic: params.topic,
        success: this.transfer.bind(this, {request: true}),
    }

    this.emit('listen', p)
    return this
}

Gate.prototype.transfer = function (options, data, context) {
    if (!data || !data.node) {
        return context.refuse(new Error('Unexpected data format.'))
    }
    const id = holdCallbacks(this, context)

    const params = {
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
    const entry = gate._callbacks.add({
        reply: context.reply,
        refuse: context.refuse,
    })

    if (entry.substituted) {
        const disconnectedErr = new errors.DisconnectedError('Node disconnected.', {remote: false})
        entry.substituted.refuse(disconnectedErr)
    }

    return entry.id
}

Gate.prototype._transfer = function (data) {
    throw new Error('"_transfer" method is not implimented.')
}

Gate.prototype.receive = function (data) {
    const params = {}
    params.success = this.transfer.bind(this, {isReply: true, externalId: data.id})
    params.error = this.transfer.bind(this, {isRefuse: true, externalId: data.id})

    if (data.request) {
        params.to = data.node
        params.topic = data.topic
        params.data = data.data
        params.as = data.sender
        this.send(params)
        return
    }

    const cbs = this._callbacks.remove(data.externalId)

    if (cbs) {
        if (data.isReply) {
            cbs.reply(data.data, params)
        } else if (data.isRefuse) {
            cbs.refuse(errors.deserialize(data.data), params)
        }
    } else {
        const disconnectedErr = new errors.DisconnectedError('Node disconnected.', {remote: true})
        params.error(disconnectedErr)
    }

    return this
}
