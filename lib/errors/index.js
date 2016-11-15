var BaseError = require('./BaseError')
var DisconnectedError = require('./DisconnectedError')
var TimeoutError = require('./TimeoutError')

module.exports = {
    BaseError: BaseError,
    DisconnectedError: DisconnectedError,
    TimeoutError: TimeoutError,

    serialize: function (error) {
        return {
            name: error.name,
            message: error.message,
            data: error.data,
        }
    },

    deserialize: function (obj) {
        switch (obj.name) {
            case 'TimeoutError':
                return new TimeoutError(obj.message, obj.data)
            case 'DisconnectedError':
                return new DisconnectedError(obj.message, obj.data)
            case 'BaseError':
            default:
                return new BaseError(obj.message, obj.data)
        }
    },

}
