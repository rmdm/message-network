'use strict'

import assert from 'assert'
import RestrictedMap from '../../../lib/util/RestrictedMap'

describe('RestrictedMap class', function () {

    var map

    beforeEach(function () {
        map = new RestrictedMap(3)
    })

    describe('constructor', function () {

        it('sets default max map size to 1', function () {
            map = new RestrictedMap()
            assert(map.maxSize, 1)
        })

    })

    describe('add method', function () {

        it('returns entry object, containing added value id', function () {
            var entry = map.add()
            assert(entry.id)
        })

        it('forms linked list of entries', function () {
            var entryA = map.add('a')
            var entryB = map.add('b')
            var entryC = map.add('c')

            var a = map.map.get(entryA.id)

            assert.equal(map.map.size, 3)

            assert.equal(entryC.substituted, null)

            assert.equal(a.prev, null)
            assert.equal(a.value, 'a')
            assert.equal(a.next.value, 'b')
            assert.equal(a.next.next.value, 'c')
            assert.equal(a.next.next.next, null)
        })

        it('removes the least recently added value if max map size is exceeded', function () {
            var entryA = map.add('a')
            var entryB = map.add('b')
            var entryC = map.add('c')
            var entryD = map.add('d')

            var a = map.map.get(entryA.id)
            var b = map.map.get(entryB.id)

            assert.equal(map.map.size, 3)

            assert.equal(entryD.substituted, 'a')
            assert.equal(a, null)

            assert.equal(b.value, 'b')
            assert.equal(b.next.value, 'c')
            assert.equal(b.next.next.value, 'd')
            assert.equal(b.next.next.next, null)
        })

    })

    describe('remove method', function () {

        it('returns null if passed key has no matching value', function () {
            var removed = map.remove(1)
            assert.equal(removed, null)
        })

        it('maintains linked list coherent when non-terminal entry is removed', function () {
            var entryA = map.add('a')
            var entryB = map.add('b')
            var entryC = map.add('c')

            map.remove(entryB.id)

            var a = map.map.get(entryA.id)

            assert.equal(a.prev, null)
            assert.equal(a.value, 'a')
            assert.equal(a.next.value, 'c')
            assert.equal(a.next.next, null)
        })

        it('maintains linked list coherent when terminal entry is removed', function () {
            var entryA = map.add('a')
            var entryB = map.add('b')
            var entryC = map.add('c')

            map.remove(entryC.id)

            var a = map.map.get(entryA.id)

            assert.equal(a.prev, null)
            assert.equal(a.value, 'a')
            assert.equal(a.next.value, 'b')
            assert.equal(a.next.next, null)
        })

    })

})
