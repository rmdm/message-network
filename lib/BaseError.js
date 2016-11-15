var inherits = require('util').inherits

module.exports = BaseError

inherits(BaseError, Error)

function BaseError (message, data) {
    Error.call(this, message)
    this.name = 'BaseError'
    this.message = message
    this.data = data
}

BaseError.serialize = function (error) {
    return {
        name: error.name,
        message: error.message,
        data: error.data,
    }
}

BaseError.deserialize = function (obj) {
    switch (obj.name) {
        case 'TimeoutError':
            var TimeoutError = require('./TimeoutError')
            return new TimeoutError(obj.message, obj.data)
        case 'DisconnectedError':
            var DisconnectedError = require('./DisconnectedError')
            return new DisconnectedError(obj.message, obj.data)
        case 'BaseError':
        default:
            return new BaseError(obj.message, obj.data)
    }
}
