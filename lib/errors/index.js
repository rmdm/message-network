'use strict'

import BaseError from './BaseError'
import DisconnectedError from './DisconnectedError'
import TimeoutError from './TimeoutError'

export {
    BaseError,
    DisconnectedError,
    TimeoutError,
}

export function serialize (error) {
        return {
            name: error.name,
            message: error.message,
            data: error.data,
        }
    }

export function deserialize (obj) {
    switch (obj.name) {
        case 'TimeoutError':
            return new TimeoutError(obj.message, obj.data)
        case 'DisconnectedError':
            return new DisconnectedError(obj.message, obj.data)
        case 'BaseError':
        default:
            return new BaseError(obj.message, obj.data)
    }
}
