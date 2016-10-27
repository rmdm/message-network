var Node = require('./Node')
var inherits = require('util').inherits

module.exports = Gate

var MAX_HELD_CB_COUNT = 1000

inherits(Gate, Node)

function Gate () {
    if (!(this instanceof Gate)) {
        return new Gate()
    }
    Node.call(this)
    this._callbacks = {}
}

Gate.prototype.super = function () {
    return this.constructor.super_.prototype
}

Gate.prototype.transfer = function (data) {
    throw new Error('"transfer" method is not implimented.')
}

Gate.prototype.receive = function (data) {
    this.request({
        node: data.node,
        event: data.context.event,
        data: data.data,
        callback: function (data, context) {

        }
    })
}

Gate.prototype.listen = function (params) {
    var p = {
        node: params.node,
        event: params.event,
        handler: makeGateListenHandler(this),
    }
    this.super().listen(p)
}

function makeGateListenHandler (gate) {
    return function (data, context) {
        var handlerId = uniqueId()
        registerCallbacks(gate._callbacks, context)

        Promise.resolve()
        .then(function () {
            gate.transfer({
                id: handlerId,
                data: data.data,
                node: data.node,
                context: context,
            })
        })
        .then(null, function (err) {
            var errorCb = gate._callbacks[handlerId].error
            if (errorCb) {
                errorCb(err)
            }
            delete gate._callbacks[handlerId]
        })
    }
}

function registerCallbacks (callbacks, context) {
    gate._callbacks[handlerId] = {
        reply: context.reply,
        error: context.error,
    }
}

Gate.prototype.notify = function (params) {
    this.emit('notify', params)
}

Gate.prototype.request = function (params) {
    this.emit('request', params)
}

Gate.prototype.action = function (params) {
    this.emit('action:register', params)
}

Gate.prototype.cancelAction = function (params) {
    this.emit('action:cancel', params)
}

Gate.prototype.stopListen = function (params) {
    this.emit('listen:stop', params)
}


var _id = 0

function uniqueId () {
    return ++_id
}
