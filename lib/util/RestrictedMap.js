'use strict'

export default RestrictedMap

function RestrictedMap (size) {
    this.maxSize = size > 1 ? size : 1
    this.map = new Map()
    this.first = null
    this.last = null

    Object.defineProperty(this, 'uniqueId', {
        get: makeUniqueId(),
    })
}

RestrictedMap.prototype.add = function (value) {
    const key = this.uniqueId

    const entry = {
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

    var substituted = null

    if (this.map.size === this.maxSize) {
        substituted = this.remove(this.first.key)
    }

    this.map.set(key, entry)

    return {
        id: key,
        substituted: substituted,
    }
}

RestrictedMap.prototype.remove = function (key) {
    const entry = this.map.get(key)
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

function makeUniqueId () {
    var count = 0
    return function () {
        return ++count
    }
}
