describe('HandlersMap class', function () {

    var assert = require('assert')
    var HandlersMap = require('../../../lib/util/HandlersMap')

    var map

    beforeEach(function () {
        map = new HandlersMap
    })

    describe('add method', function () {

        it('registers a notification handler with a gate', function () {
            var handler = function () {}

            map.add({
                as: 'progressbar',
                to: {
                    gate: 'server',
                    node: 'task',
                },
                topic: 'progress',
                handler: handler,
            })

            assert(checkMap(map.gates, {
                'server': {
                    'task': {
                        'progressbar': {
                            'progress': [handler],
                        }
                    }
                }
            }))
        })

        it('registers a notification handler without a gate', function () {
            var handler = function () {}

            map.add({
                as: 'progressbar',
                to: 'task',
                topic: 'progress',
                handler: handler,
            })

            assert(checkMap(map.nodes, {
                'task': {
                    'progressbar': {
                        'progress': [handler],
                    }
                }
            }))
            assert(checkMap(map.gates, {}))
        })

        it('registers many notification handlers with gates', function () {
            var handler = function () {}

            map.add({
                as: 'progressbar',
                to: [
                    {
                        gate: 'server',
                        node: 'process',
                    },
                    {
                        gate: 'client',
                        node: 'task',
                    },
                    'loader',
                ],
                topic: 'progress',
                handler: handler,
            })

            assert(checkMap(map.gates, {
                'server': {
                    'process': {
                        'progressbar': {
                            'progress': [handler],
                        }
                    },
                },
                'client': {
                    'task': {
                        'progressbar': {
                            'progress': [handler],
                        }
                    },
                }
            }))
            assert(checkMap(map.nodes, {
                'loader': {
                    'progressbar': {
                        'progress': [handler],
                    }
                }
            }))
        })

        it('registers many gate node handlers in pairs', function () {
            var handler = function () {}

            map.add({
                as: 'progressbar',
                to: [
                    {
                        gate: ['server', 'client'],
                        node: ['task', 'process'],
                    },
                ],
                topic: 'progress',
                handler: handler,
            })

            assert(checkMap(map.gates, {
                'server': {
                    'process': {
                        'progressbar': {
                            'progress': [handler],
                        }
                    },
                    'task': {
                        'progressbar': {
                            'progress': [handler],
                        }
                    },
                },
                'client': {
                    'process': {
                        'progressbar': {
                            'progress': [handler],
                        }
                    },
                    'task': {
                        'progressbar': {
                            'progress': [handler],
                        }
                    },
                }
            }))
            assert(checkMap(map.nodes, {}))
        })

        it('registers notification handler on many topics', function () {
            var handler = function () {}

            map.add({
                as: 'a',
                to: 'b',
                topic: ['c', 'd'],
                handler: handler,
            })

            assert(checkMap(map.nodes, {
                'b': {
                    'a': {
                        'c': [handler],
                        'd': [handler],
                    }
                }
            }))
            assert(checkMap(map.gates, {}))
        })

        it('registers many notification handlers on many topics', function () {
            var handler1 = function () {}
            var handler2 = function () {}

            map.add({
                as: 'a',
                to: 'b',
                topic: ['c', 'd'],
                handler: [handler1, handler2],
            })

            assert(checkMap(map.nodes, {
                'b': {
                    'a': {
                        'c': [handler1, handler2],
                        'd': [handler1, handler2],
                    }
                }
            }))
            assert(checkMap(map.gates, {}))
        })

        it('registers notification handler on all topics', function () {
            var handler = function () {}

            map.add({
                as: 'a',
                to: 'b',
                topic: 'c',
                handler: handler,
            })

            map.add({
                as: 'a',
                to: 'b',
                topic: '*',
                handler: handler,
            })

            assert(checkMap(map.nodes, {
                'b': {
                    'a': {
                        'c': [handler],
                        '*': [handler]
                    }
                }
            }))
            assert(checkMap(map.gates, {}))

        })

    })

    describe('remove method', function () {

        var map, handler

        beforeEach(function () {
            map = new HandlersMap()
            handler = function () {}

            map.add({
                as: 'node',
                to: {
                    gate: ['a', 'b', 'c'],
                    node: ['x', 'y', 'z'],
                },
                topic: ['e'],
                handler: handler,
            })

        })

        it('removes some listeners by gate', function () {
            map.remove({
                as: 'node',
                to: {
                    gate: ['a', 'b'],
                },
            })

            assert(checkMap(map.gates, {
                c: {
                    x: {
                        node: {
                            e: [handler],
                        }
                    },
                    y: {
                        node: {
                            e: [handler],
                        }
                    },
                    z: {
                        node: {
                            e: [handler],
                        }
                    }
                }
            }))
            assert(checkMap(map.nodes, {}))
        })

        it('removes some handlers by node', function () {
            map.remove({
                as: 'node',
                to: {
                    gate: ['a', 'b', 'c'],
                    node: ['x', 'z'],
                },
            })

            assert(checkMap(map.gates, {
                a: {
                    y: {
                        node: {
                            e: [handler],
                        }
                    },
                },
                b: {
                    y: {
                        node: {
                            e: [handler],
                        }
                    },
                },
                c: {
                    y: {
                        node: {
                            e: [handler],
                        }
                    },
                }
            }))
            assert(checkMap(map.nodes, {}))
        })

        it('removes some handlers by nodes', function () {
            map.remove({
                as: 'node',
                to: {
                    gate: ['a', 'b'],
                    node: ['x', 'z'],
                },
            })

            assert(checkMap(map.gates, {
                a: {
                    y: {
                        node: {
                            e: [handler],
                        }
                    },
                },
                b: {
                    y: {
                        node: {
                            e: [handler],
                        }
                    },
                },
                c: {
                    x: {
                        node: {
                            e: [handler],
                        }
                    },
                    y: {
                        node: {
                            e: [handler],
                        }
                    },
                    z: {
                        node: {
                            e: [handler],
                        }
                    },
                }
            }))

            assert(checkMap(map.nodes, {}))
        })

        it('removes some handlers by topic', function () {
            map.remove({
                as: 'node',
                to: {
                    gate: ['a', 'b', 'c'],
                    node: ['x', 'z'],
                },
                topic: 'e',
            })

            assert(checkMap(map.gates, {
                a: {
                    y: {
                        node: {
                            e: [handler],
                        }
                    },
                },
                b: {
                    y: {
                        node: {
                            e: [handler],
                        }
                    },
                },
                c: {
                    y: {
                        node: {
                            e: [handler],
                        }
                    },
                }
            }))
            assert(checkMap(map.nodes, {}))
        })

        it('removes some handlers by topics', function () {
            var map = new HandlersMap()

            map.add({
                as: 'node',
                to: {
                    gate: ['a', 'b'],
                    node: ['x', 'y', 'z'],
                },
                topic: ['e1', 'e2', 'e3'],
                handler: handler,
            })

            map.remove({
                as: 'node',
                to: {
                    gate: ['a'],
                    node: ['x', 'z'],
                },
                topic: ['e1', 'e2'],
            })

            assert(checkMap(map.gates, {
                a: {
                    x: {
                        node: {
                            e3: [handler],
                        }
                    },
                    y: {
                        node: {
                            e1: [handler],
                            e2: [handler],
                            e3: [handler],
                        }
                    },
                    z: {
                        node: {
                            e3: [handler],
                        }
                    },
                },
                b: {
                    x: {
                        node: {
                            e1: [handler],
                            e2: [handler],
                            e3: [handler],
                        }
                    },
                    y: {
                        node: {
                            e1: [handler],
                            e2: [handler],
                            e3: [handler],
                        }
                    },
                    z: {
                        node: {
                            e1: [handler],
                            e2: [handler],
                            e3: [handler],
                        }
                    },
                },
            }))
            assert(checkMap(map.nodes, {}))
        })

        it('removes some handlers by handlers', function () {
            var map = new HandlersMap()

            var handler1 = function () {}
            var handler2 = function () {}
            var handler3 = function () {}

            map.add({
                as: 'node',
                to: 'z',
                topic: 'e',
                handler: [handler1, handler2, handler3]
            })

            map.remove({
                as: 'node',
                to: ['x', 'z'],
                topic: 'e',
                handler: [handler1, handler2],
            })

            assert(checkMap(map.nodes, {
                z: {
                    node: {
                        e: [handler3],
                    }
                },
            }))

            assert(checkMap(map.gates, {}))
        })

        it('reverts handlers to initial empty state', function () {
            var map = new HandlersMap()

            map.add({
                as: 'progressbar',
                to: [
                    {
                        gate: ['server'],
                        node: 'process',
                    },
                    {
                        gate: 'client',
                        node: ['task'],
                    },
                    'loader',
                ],
                topic: 'progress',
                handler: handler,
            })

            map.remove({
                as: 'progressbar',
                to: [
                    {
                        gate: ['server'],
                        node: 'process',
                    },
                    {
                        gate: 'client',
                        node: ['task'],
                    },
                    'loader',
                ],
                topic: 'progress',
                handler: handler,
            })

            assert(checkMap(map.gates, {}))
            assert(checkMap(map.nodes, {}))
        })

        it('removes all listeners of all topics of a node, but not on specific topics', function () {
            var map = new HandlersMap()

            map.add({
                as: 'a',
                to: {
                    node: 'b',
                },
                topic: ['c'],
                handler: [handler],
            })

            map.add({
                as: 'a',
                to: 'b',
                topic: '*',
                handler: [handler],
            })

            map.remove({
                as: 'a',
                to: 'b',
                topic: '*',
                handler: [handler],
            })

            assert(checkMap(map.nodes, {
                'b': {
                    'a': {
                        'c': [handler],
                    }
                }
            }))
            assert(checkMap(map.gates, {}))

        })

    })

    function checkMap (map, values) {
        if (map.size !== Object.keys(values).length) { return false }

        for (var entry of map.entries()) {
            var key = entry[0],
                value = entry[1]
            if (value instanceof Map && !checkMap(value, values[key])) {
                return false
            }
            if (value instanceof Set && !checkSet(value, values[key])) {
                return false
            }
        }

        return true
    }

    function checkSet (set, values) {
        if (set.size !== values.length) { return false }
        var i = 0
        for (var v of set) {
            if (v !== values[i++]) { return false }
        }
        return true
    }

})
