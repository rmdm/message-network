describe('Net class', function () {

    var assert = require('assert')
    var Net = require('../../lib/Net.js')
    var Node = require('../../lib/Node.js')

    describe('constructor', function () {

        it('returns an instance of Net class when called as a function', function () {
            var enet = Net()
            assert(enet instanceof Net)
        })

    })

    describe('node method', function () {

        it('returns a connected node of the network by its name', function () {
            var enet = Net()
            var node = Node()
            enet.connect('node', node)

            var result = enet.node('node')

            assert.equal(result, node)
        })

        it('returns null when a node is not connected to a network', function () {
            var enet = Net()
            var node = Node()

            var netNode = enet.node('node')

            assert.strictEqual(netNode, null)
        })

    })

    describe('names method', function () {

        it('returns a connected node names of the network by node', function () {
            var enet = Net()
            var node = {}
            enet.connect('node', node)
            enet.connect('another-node', node)
            enet.connect('one-more-node', {})

            var names = enet.names(node).sort()

            assert.deepEqual(names, ['another-node', 'node'])
        })

    })

    describe('connect method', function () {

        it('connects an enet.Node instance node', function () {
            var enet = Net()
            var node = Node()

            enet.connect('node', node)
            var netNode = enet.node('node')

            assert.equal(netNode, node)
        })

        it('returns a network itself', function () {
            var enet = Net()
            var node = Node()

            var network = enet.connect('node', node)

            assert.equal(network, enet)
        })

        it('throws when a node is connected under an already used name', function () {
            var enet = Net()
            var node = Node()
            var anotherNode = Node()

            enet.connect('node', node)

            assert.throws(function () {
                enet.connect('node', anotherNode)
            })
        })

        it('throws when a node name is not a string', function () {
            var enet = Net()
            var node = Node()

            assert.throws(function () {
                enet.connect(1000, node)
            })
        })

        it('throws when a node is not an object', function () {
            var enet = Net()

            assert.throws(function () {
                enet.connect('node', 10)
            })
        })

        it('throws when a node name is "*"', function () {
            var enet = Net()
            var node = Node()

            assert.throws(function () {
                enet.connect('*', node)
            })
        })

        it('throws when a node name is ""', function () {
            var enet = Net()
            var node = Node()

            assert.throws(function () {
                enet.connect('', node)
            })
        })


    })

    describe('disconnect method', function () {

        it('disconnects a node from a network', function () {
            var enet = Net()
            var node = Node()

            enet.connect('node', node)
            enet.disconnect('node')
            var netNode = enet.node('node')

            assert.equal(netNode, null)
        })

        it('returns a network itself', function () {
            var enet = Net()
            var node = Node()

            enet.connect('node', node)
            var network = enet.disconnect('node')

            assert.equal(network, enet)
        })

    })

    describe('reconnect method', function () {

        it('disconnects a node from a network and connects another one to it', function () {
            var enet = Net()
            var node = Node()
            var anotherNode = Node()

            enet.connect('node', node)
            enet.reconnect('node', anotherNode)
            var netNode = enet.node('node')

            assert.equal(netNode, anotherNode)
            assert.notEqual(netNode, node)
        })

        it('returns a network itself', function () {
            var enet = Net()
            var node = Node()

            var network = enet.reconnect('node', node)

            assert.equal(network, enet)
        })

    })

    describe('listen method', function () {

        it('registers a notification handler with a gate', function () {
            var enet = Net()
            var handler = function () {}

            enet.listen({
                as: 'progressbar',
                gate: 'server',
                node: 'task',
                event: 'progress',
                handler: handler,
            })

            assert.deepEqual(enet._handlers, {
                gates: {
                    'server': {
                        'task': {
                            'progressbar': {
                                'progress': [handler],
                            }
                        }
                    }
                },
                nodes: {},
            })
        })

        it('registers a notification handler without a gate', function () {
            var enet = Net()
            var handler = function () {}

            enet.listen({
                as: 'progressbar',
                node: 'task',
                event: 'progress',
                handler: handler,
            })

            assert.deepEqual(enet._handlers, {
                gates: {},
                nodes: {
                    'task': {
                        'progressbar': {
                            'progress': [handler],
                        }
                    }
                },
            })
        })

        it('registers many notification handlers with gates', function () {
            var enet = Net()
            var handler = function () {}

            enet.listen({
                as: 'progressbar',
                gate: ['server', 'client'],
                node: ['task', 'process'],
                event: 'progress',
                handler: handler,
            })

            assert.deepEqual(enet._handlers, {
                gates: {
                    'server': {
                        'task': {
                            'progressbar': {
                                'progress': [handler],
                            }
                        },
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
                        'process': {
                            'progressbar': {
                                'progress': [handler],
                            }
                        },
                    }
                },
                nodes: {},
            })
        })

        it('registers notification handler on many events', function () {
            var enet = Net()
            var handler = function () {}

            enet.listen({
                as: 'a',
                node: 'b',
                event: ['c', 'd'],
                handler: handler,
            })

            assert.deepEqual(enet._handlers, {
                gates: {},
                nodes: {
                    'b': {
                        'a': {
                            'c': [handler],
                            'd': [handler],
                        }
                    }
                }
            })
        })

        it('registers many notification handlers on many events', function () {
            var enet = Net()
            var handler1 = function () {}
            var handler2 = function () {}

            enet.listen({
                as: 'a',
                node: 'b',
                event: ['c', 'd'],
                handler: [handler1, handler2],
            })

            assert.deepEqual(enet._handlers, {
                gates: {},
                nodes: {
                    'b': {
                        'a': {
                            'c': [handler1, handler2],
                            'd': [handler1, handler2],
                        }
                    }
                }
            })
        })

        it('registers notification handler on all events', function () {
            var enet = Net()
            var handler = function () {}

            enet.listen({
                as: 'a',
                node: 'b',
                event: 'c',
                handler: handler,
            })

            enet.listen({
                as: 'a',
                node: 'b',
                event: '*',
                handler: handler,
            })

            assert.deepEqual(enet._handlers, {
                gates: {},
                nodes: {
                    'b': {
                        'a': {
                            'c': [handler],
                            '*': [handler]
                        }
                    }
                }
            })

        })

    })

    describe('notify method', function () {

        it('notifies an event handler', function () {
            var enet = Net()

            var progress = 0
            var handler = function (data) {
                progress = data
            }

            enet.listen({
                as: 'progressbar',
                node: 'task',
                event: 'progress',
                handler: handler,
            })

            enet.notify({
                as: 'task',
                node: 'progressbar',
                event: 'progress',
                data: 50,
            })

            assert.equal(progress, 50)
        })

        it('notifies multiple event handlers with an event', function () {
            var enet = Net()

            var progress = 0, context
            var handler = function (data, _context) {
                progress = data
                context = _context
            }

            var anotherProgress = 0, anotherContext
            var anotherHandler = function (data, _context) {
                anotherProgress = data
                anotherContext = _context
            }

            enet.listen({
                as: 'progressbar',
                node: 'task',
                event: 'progress',
                handler: handler,
            })

            enet.listen({
                as: 'anotherProgressbar',
                node: 'task',
                event: 'progress',
                handler: anotherHandler,
            })

            enet.notify({
                as: 'task',
                node: ['progressbar', 'anotherProgressbar'],
                event: 'progress',
                data: 50,
            })

            assert.equal(progress, 50)
            assert.equal(anotherProgress, 50)

            assert.deepEqual(context, {
                sender: {
                    node: 'task'
                },
                event: 'progress',
            })
            assert.deepEqual(anotherContext, {
                sender: {
                    node: 'task',
                },
                event: 'progress',
            })
        })

        it('notifies multiple event handlers of the same event', function () {
            var enet = Net()
            var handler1Events = []
            var handler2Events = []
            var handler1 = function (data, context) {
                handler1Events.push(context.event)
            }
            var handler2 = function (data, context) {
                handler2Events.push(context.event)
            }

            enet.listen({
                as: 'a',
                node: 'b',
                event: ['e', 'e1', 'e2'],
                handler: [handler1, handler2]
            })

            enet.notify({
                as: 'b',
                node: 'a',
                event: 'e',
                data: 'data',
            })

            assert.deepEqual(handler1Events, ['e'])
        })

        it('notifies handlers of all events and specific of the current one', function () {
            var enet = Net()
            var firesCount = 0
            var handler1 = function () { firesCount++ }
            var handler2 = function () { firesCount++ }

            enet.listen({
                as: 'a',
                node: 'b',
                event: ['c'],
                handler: [handler1],
            })

            enet.listen({
                as: 'a',
                node: 'b',
                event: '*',
                handler: [handler2],
            })

            enet.notify({
                as: 'b',
                node: 'a',
                event: 'c',
            })

            assert.deepEqual(firesCount, 2)
        })

        it('notifies handlers of all events and specific of the current one but not more than once per sender', function () {
            var enet = Net()
            var firesCount = 0
            var handler = function () { firesCount++ }

            enet.listen({
                as: 'a',
                node: 'b',
                event: ['c'],
                handler: [handler],
            })

            enet.listen({
                as: 'a',
                node: 'b',
                event: '*',
                handler: [handler],
            })

            enet.notify({
                as: 'b',
                node: 'a',
                event: 'c',
            })

            assert.deepEqual(firesCount, 1)
        })

        it('notifies a node event handler from a gate', function () {
            var enet = Net()

            var call = {}
            var handler = function (data, context) {
                call.data = data
                call.context = context
            }

            enet.listen({
                as: 'a',
                gate: 'g',
                node: 'b',
                event: 'e',
                handler: handler,
            })

            enet.notify({
                as: {
                    gate: 'g',
                    node: 'b',
                },
                node: 'a',
                event: 'e',
            })

            assert.deepEqual(call, {
                data: undefined,
                context: {
                    sender: {
                        gate: 'g',
                        node: 'b',
                    },
                    event: 'e',
                }
            })
        })

        it('notifies all interested listeners', function () {
            var enet = Net()

            var called1 = false
            var called2 = false
            var handler1 = function (data, context) {
                called1 = true
            }
            var handler2 = function (data, context) {
                called2 = true
            }

            enet.listen({
                as: 'a',
                node: 'b',
                event: 'e',
                handler: handler1,
            })

            enet.listen({
                as: 'c',
                node: 'b',
                event: 'e',
                handler: handler2,
            })

            enet.notify({
                as: 'b',
                node: '*',
                event: 'e',
                data: 'smth',
            })

            assert(called1)
            assert(called2)

        })

        it('notifies all interested listeners of all nodes', function () {
            var enet = Net()

            var call = {}
            var handler = function (data, context) {
                call.data = data
                call.context = context
            }

            enet.listen({
                as: 'a',
                node: '*',
                event: 'e',
                handler: handler,
            })

            enet.notify({
                as: 'b',
                node: '*',
                event: 'e',
                data: 'smth',
            })

            assert.deepEqual(call, {
                data: 'smth',
                context: {
                    sender: {
                        node: 'b',
                    },
                    event: 'e',
                }
            })
        })

        it('notifies all gates', function () {
            var enet = Net()
            var call1 = {}, call2 = {}
            var handler1 = function (data, context) {
                call1.data = data
                call1.context = context
            }
            var handler2 = function (data, context) {
                call2.data = data
                call2.context = context
            }

            enet.listen({
                as: 'g',
                node: 'b',
                event: 'e',
                handler: handler1,
            })

            enet.listen({
                as: 'g2',
                node: 'b',
                event: 'e',
                handler: handler2,
            })

            enet.notify({
                as: 'b',
                gate: '*',
                node: 'a',
                event: 'e',
            })

            assert.deepEqual(call1, {
                data: {
                    node: 'a',
                    data: undefined
                },
                context: {
                    sender: {
                        node: 'b',
                    },
                    event: 'e',
                }
            })
            assert.deepEqual(call2, {
                data: {
                    node: 'a',
                    data: undefined
                },
                context: {
                    sender: {
                        node: 'b',
                    },
                    event: 'e',
                }
            })
        })

        it('throws when trying to notify a gate from a gate', function () {
            var enet = Net()
            var handler = function () {}

            enet.listen({
                as: 'a',
                node: '*',
                event: '*',
                handler: handler,
            })

            assert.throws(function () {
                enet.notify({
                    as: {
                        gate: 'a',
                        node: 'a',
                    },
                    gate: 'a',
                    node: 'a',
                    event: 'e',
                })
            })
        })

    })

    describe('stopListen method', function () {

        var enet, handler

        beforeEach(function () {
            enet = Net()
            handler = function () {}

            enet.listen({
                as: 'node',
                gate: ['a', 'b', 'c'],
                node: ['x', 'y', 'z'],
                event: ['e'],
                handler: handler,
            })

        })

        it('removes some listeners by gate', function () {
            enet.stopListen({
                as: 'node',
                gate: ['a', 'b'],
            })

            assert.deepEqual(enet._handlers, {
                gates: {
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
                },
                nodes: {},
            })
        })

        it('removes some handlers by node', function () {
            enet.stopListen({
                as: 'node',
                gate: ['a', 'b', 'c'],
                node: ['x', 'z'],
            })

            assert.deepEqual(enet._handlers, {
                gates: {
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
                },
                nodes: {},
            })
        })

        it('removes some handlers by nodes', function () {
            enet.stopListen({
                as: 'node',
                gate: ['a', 'b'],
                node: ['x', 'z'],
            })

            assert.deepEqual(enet._handlers, {
                gates: {
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
                },
                nodes: {},
            })
        })

        it('removes some handlers by event', function () {
            enet.stopListen({
                as: 'node',
                gate: ['a', 'b', 'c'],
                node: ['x', 'z'],
                event: 'e',
            })

            assert.deepEqual(enet._handlers, {
                gates: {
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
                },
                nodes: {},
            })
        })

        it('removes some handlers by events', function () {
            var enet = Net()
            enet.listen({
                as: 'node',
                gate: ['a', 'b'],
                node: ['x', 'y', 'z'],
                event: ['e1', 'e2', 'e3'],
                handler: handler,
            })

            enet.stopListen({
                as: 'node',
                gate: ['a'],
                node: ['x', 'z'],
                event: ['e1', 'e2'],
            })

            assert.deepEqual(enet._handlers, {
                gates: {
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
                },
                nodes: {},
            })
        })

        it('removes some handlers by handlers', function () {

            var enet = Net()
            var handler1 = function () {}
            var handler2 = function () {}
            var handler3 = function () {}

            enet.listen({
                as: 'node',
                node: 'z',
                event: 'e',
                handler: [handler1, handler2, handler3]
            })

            enet.stopListen({
                as: 'node',
                node: ['x', 'z'],
                event: 'e',
                handler: [handler1, handler2],
            })

            assert.deepEqual(enet._handlers, {
                gates: {},
                nodes: {
                    z: {
                        node: {
                            e: [handler3],
                        }
                    },
                },
            })
        })

        it('reverts handlers to initial empty state', function () {
            var enet = Net()
            enet.listen({
                as: 'a',
                gate: 'b',
                node: 'c',
                event: 'e',
                handler: handler,
            })

            enet.stopListen({
                as: 'a',
                gate: 'b',
                node: 'c',
                event: 'e',
                handler: handler,
            })

            assert.deepEqual(enet._handlers, {
                gates: {},
                nodes: {},
            })
        })

        it('removes all listeners of all events of a node, but not on specific events', function () {
            var enet = Net()

            enet.listen({
                as: 'a',
                node: 'b',
                event: ['c'],
                handler: [handler],
            })

            enet.listen({
                as: 'a',
                node: 'b',
                event: '*',
                handler: [handler],
            })

            enet.stopListen({
                as: 'a',
                node: 'b',
                event: '*',
                handler: [handler],
            })

            assert.deepEqual(enet._handlers, {
                gates: {},
                nodes: {
                    'b': {
                        'a': {
                            'c': [handler],
                        }
                    }
                },
            })

        })

        it('throws when trying to remove some handlers by event', function () {
            assert.throws(function () {
                enet.stopListen({
                    as: 'node',
                    event: 'e',
                })
            })
        })

        it('throws when trying to remove some handlers by handler', function () {
            assert.throws(function () {
                enet.stopListen({
                    as: 'node',
                    handler: handler,
                })
            })
        })

    })

    describe('action method', function () {

        it('registers request handler for an action', function () {
            var enet = Net()
            var handler = function () {}

            enet.action({
                as: 'a',
                gate: 'g',
                node: 'b',
                action: 'action',
                handler: handler,
            })

            assert.deepEqual(enet._actionHandlers, {
                gates: {
                    g: {
                        b: {
                            a: {
                                action: [handler],
                            }
                        }
                    }
                },
                nodes: {},
            })
        })

    })

    describe('request method', function () {

        it('requests an action from a node', function () {
            var enet = Net()
            var handler = function sum (data, context) {
                var result = 0
                result = data.reduce(function (result, operand) {
                    result += operand
                    return result
                }, result)
                context.reply(result)
            }

            enet.action({
                as: 'calculator',
                node: 'scientist',
                action: 'sum',
                handler: handler,
            })

            var error, data, context

            enet.request({
                as: 'scientist',
                node: 'calculator',
                action: 'sum',
                data: [1, 2, 3, 4, 5],
                callback: function (_error, _data, _context) {
                    error = _error
                    data = _data
                    context = _context
                }
            })

            assert.strictEqual(error, null)
            assert.equal(data, 15)
            assert.deepEqual(context, {
                action: 'sum',
                sender: {
                    node: 'calculator',
                },
            })

        })

    })

    describe('cancelAction method', function () {

        it('removes an action handler', function () {
            var enet = Net()

            var sum = function sum (data, context) {}
            var log = function log (data, context) {}

            enet.action({
                as: 'calculator',
                node: '*',
                action: 'add',
                handler: [sum, log],
            })

            enet.cancelAction({
                as: 'calculator',
                node: '*',
                action: 'add',
                handler: log,
            })

            assert.deepEqual(enet._actionHandlers, {
                gates: {},
                nodes: {
                    '*': {
                        calculator: {
                            'add': [sum],
                        }
                    }
                },
            })
        })

    })

})

