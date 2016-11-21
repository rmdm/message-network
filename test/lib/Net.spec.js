describe('Net class', function () {

    var assert = require('assert')
    var sinon = require('sinon')

    var Net = require('../../lib/Net')
    var Node = require('../../lib/Node')
    var Gate = require('../../lib/Gate')
    var MemoryGate = require('../../lib/MemoryGate')

    var errors = require('../../lib/errors')

    var EventEmitter = require('events').EventEmitter

    var enet, node, gate

    beforeEach(function () {
        enet = Net()
        node = Node()
        gate = Gate()
    })

    describe('constructor', function () {

        it('returns an instance of Net class when called as a function', function () {
            assert(enet instanceof Net)
        })

    })

    describe('node method', function () {

        it('returns a connected node of the network by its name', function () {
            enet.connect('node', node)

            var result = enet.node('node')

            assert.equal(result, node)
        })

        it('returns null when a node is not connected to a network', function () {
            var netNode = enet.node('node')

            assert.strictEqual(netNode, null)
        })

    })

    describe('names method', function () {

        it('returns a connected node names of the network by node', function () {
            enet.connect('node', node)
            enet.connect('another-node', node)
            enet.connect('one-more-node', {})

            var names = enet.names(node).sort()

            assert.deepEqual(names, ['another-node', 'node'])
        })

    })

    describe('connect method', function () {

        it('connects a Node instance node', function () {
            enet.connect('node', node)
            var netNode = enet.node('node')

            assert.equal(netNode, node)
        })

        it('connects a Gate instance node', function () {
            enet.connect('gate', gate)

            assert.equal(enet._gates['gate'], gate)
        })

        it('listens on node "listen" method and sets its "as" parameter as passed node "name"', function () {
            var listen = sinon.stub(enet, 'listen')

            enet.connect('node', node)

            node.listen()

            assert(listen.calledWithMatch({as: 'node'}))
        })

        it('listens on node "send" method and sets its "as" parameter as passed node "name"', function () {
            var send = sinon.stub(enet, 'send')

            enet.connect('node', node)

            node.send()

            assert(send.calledWithMatch({as: 'node'}))
        })

        it('listens on node "unlisten" method and sets its "as" parameter as passed node "name"', function () {
            var unlisten = sinon.stub(enet, 'unlisten')

            enet.connect('node', node)

            node.unlisten()

            assert(unlisten.calledWithMatch({as: 'node'}))
        })

        it('links to another net through MemoryGate if passed node is of Net type', function () {
            var anotherNet = Net()

            enet.connect('node', anotherNet, {remoteGateName: 'gate'})

            var enetGate = enet.node('node')
            var anotherNetGate = anotherNet.node('gate')

            assert(enetGate instanceof MemoryGate)
            assert(anotherNetGate instanceof MemoryGate)
            assert.equal(enetGate._endpoint, anotherNetGate)
            assert.equal(anotherNetGate._endpoint, enetGate)
        })

        it('retriggers events of passed node into net if it is of EventEmitter type', function () {
            var send = sinon.stub(enet, 'send')
            var ee = new EventEmitter()

            enet.connect('node', ee, {events: ['event']})

            ee.emit('event', 'data')

            assert(send.calledWithMatch({
                as: 'node',
                to: '*',
                topic: 'event',
                data: 'data',
            }))
        })

        it('wraps passed node if it is not of Node type', function () {
            enet.connect('node', {iamnode: true})

            var netNode = enet.node('node')

            assert(netNode instanceof Node)
            assert.equal(netNode.iamnode, true)
        })

        it('returns a network itself', function () {
            var network = enet.connect('node', node)

            assert.equal(network, enet)
        })

        it('throws when a node is connected under an already used name', function () {
            var anotherNode = Node()

            enet.connect('node', node)

            assert.throws(function () {
                enet.connect('node', anotherNode)
            })
        })

        it('throws when a node name is not a string', function () {
            assert.throws(function () {
                enet.connect(1000, node)
            })
        })

        it('throws when a node is not an object', function () {

            assert.throws(function () {
                enet.connect('node', 10)
            })
        })

        it('throws when a node name is "*"', function () {
            assert.throws(function () {
                enet.connect('*', node)
            })
        })

        it('throws when a node name is ""', function () {
            assert.throws(function () {
                enet.connect('', node)
            })
        })

    })

    describe('disconnect method', function () {

        it('disconnects a node from a network', function () {
            enet.connect('node', node)
            enet.disconnect('node')
            var netNode = enet.node('node')

            assert.equal(netNode, null)
        })

        it('removes effects set by "connect"', function () {
            var listen = sinon.stub(enet, 'listen')
            var send = sinon.stub(enet, 'send')
            var unlisten = sinon.stub(enet, 'unlisten')

            enet.connect('gate', gate)
            enet.disconnect('gate')

            gate.listen()
            gate.send()
            gate.unlisten()

            assert(!enet._nodes['gate'])
            assert(!enet._gates['gate'])
            assert(!enet._listeners['gate'])
            assert(!listen.called)
            assert(!send.called)
            assert(unlisten.calledWithMatch({
                to: '*',
            }))
        })

        it('returns a network itself', function () {
            enet.connect('node', node)
            var network = enet.disconnect('node')

            assert.equal(network, enet)
        })

    })

    describe('reconnect method', function () {

        it('disconnects a node from a network and connects another one to it', function () {
            var anotherNode = Node()

            enet.connect('node', node)
            enet.reconnect('node', anotherNode)
            var netNode = enet.node('node')

            assert.equal(netNode, anotherNode)
            assert.notEqual(netNode, node)
        })

        it('returns a network itself', function () {
            var network = enet.reconnect('node', node)

            assert.equal(network, enet)
        })

    })

    describe('send method', function () {

        it('makes chat with one participant disconnected after start', function (done) {
            var net = Net()
            var node1 = Node()
            var node2 = Node()

            net.connect('node1', node1)
            net.connect('node2', node2)

            node2.listen({
                to: 'node1',
                topic: 'chat',
                handler: function (data, context) {
                    context.reply(++data)
                },
            })

            node1.send({
                to: 'node2',
                topic: 'chat',
                data: 0,
                success: function (data, context) {
                    if (data >= 10) {
                        net.disconnect('node1')
                    }
                    context.reply(data, {
                        error: function (error, context) {
                            assert(error instanceof errors.DisconnectedError)
                            assert.deepEqual(error.data, {remote: false})
                            assert.deepEqual(context.sender, {node: 'node2'})
                            assert.equal(context.topic, 'chat')
                            done()
                        }
                    })
                },
            })

        })

        it('creates chat with another participant disconnected after start', function (done) {
            var net = Net()
            var node1 = Node()
            var node2 = Node()

            net.connect('node1', node1)
            net.connect('node2', node2)

            node2.listen({
                to: 'node1',
                topic: 'chat',
                handler: function (data, context) {
                    context.reply(++data)
                },
            })

            node1.send({
                to: 'node2',
                topic: 'chat',
                data: 0,
                success: function (data, context) {
                    if (data >= 10) {
                        net.disconnect('node2')
                    }
                    context.reply(data, {
                        error: function (error, context) {
                            assert(error instanceof errors.DisconnectedError)
                            assert.deepEqual(error.data, {remote: true})
                            assert.deepEqual(context.sender, {node: 'node2'})
                            assert.equal(context.topic, 'chat')
                            done()
                        }
                    })
                },
            })

        })

        it('makes errored chat with one participant disconnected after start', function (done) {
            var net = Net()
            var node1 = Node()
            var node2 = Node()

            net.connect('node1', node1)
            net.connect('node2', node2)

            node2.listen({
                to: 'node1',
                topic: 'chat',
                handler: function (data, context) {
                    context.reply(++data)
                },
            })

            node1.send({
                to: 'node2',
                topic: 'chat',
                data: 0,
                success: function (data, context) {
                    if (data >= 10) {
                        net.disconnect('node1')
                        context.refuse(data, {
                            error: function (error, context) {
                                assert(error instanceof errors.DisconnectedError)
                                assert.deepEqual(error.data, {remote: false})
                                assert.deepEqual(context.sender, {node: 'node2'})
                                assert.equal(context.topic, 'chat')
                                done()
                            }
                        })
                    } else {
                        context.reply(data)
                    }
                },
            })

        })

        it('makes inter-network request-response using gates', function (done) {

            var net1 = Net()
            var net2 = Net()

            var node1 = Node()
            var node2 = Node()

            net1.connect('node1', node1)
            net2.connect('node2', node2)

            net1.connect('gate1', net2, {remoteGateName: 'gate2'})

            node2.listen({
                to: {
                    gate: 'gate2',
                    node: 'node1',
                },
                topic: 'ololo',
                handler: function (data, context) {
                    assert.equal(data, 1)
                    context.reply(data * 10)
                }
            })

            net1.node('gate1').listen({
                to: 'node1',
                topic: 'ololo',
            })

            node1.send({
                to: {
                    gate: 'gate1',
                    node: 'node2',
                },
                topic: 'ololo',
                data: 1,
                success: function (data, context) {
                    assert.equal(data, 10)
                    done()
                }
            })

        })

        it('makes inter-network chat using gates', function (done) {

            var net1 = Net()
            var net2 = Net()

            var node1 = Node()
            var node2 = Node()
            var test = Node()

            net1.connect('node1', node1)
            net1.connect('test', test)
            net2.connect('node2', node2)

            net1.connect('gate1', net2, {remoteGateName: 'gate2'})

            var chat = []

            node2.listen({
                to: {
                    gate: 'gate2',
                    node: 'node1',
                },
                topic: 'ololo',
                handler: function (data, context) {
                    chat.push({
                        data: data,
                        node: 'node2',
                        sender: context.sender,
                    })
                    context.reply(++data)
                }
            })

            net1.node('gate1').listen({
                to: 'node1',
                topic: 'ololo',
            })

            node1.send({
                to: {
                    gate: 'gate1',
                    node: 'node2',
                },
                topic: 'ololo',
                data: 1,
                success: function (data, context) {
                    chat.push({
                        data: data,
                        node: 'node1',
                        sender: context.sender,
                    })
                    if (data > 5) {
                        return this.send({
                            to: 'test',
                            topic: 'done',
                        })
                    }
                    context.reply(++data)
                }
            })

            test.listen({
                to: 'node1',
                topic: 'done',
                handler: function () {
                    assert.deepEqual(chat, [
                        { data: 1, node: 'node2', sender: {gate: 'gate2', node: 'node1'} },
                        { data: 2, node: 'node1', sender: {gate: 'gate1', node: 'node2'} },
                        { data: 3, node: 'node2', sender: {gate: 'gate2', node: 'node1'} },
                        { data: 4, node: 'node1', sender: {gate: 'gate1', node: 'node2'} },
                        { data: 5, node: 'node2', sender: {gate: 'gate2', node: 'node1'} },
                        { data: 6, node: 'node1', sender: {gate: 'gate1', node: 'node2'} },
                    ])
                    done()
                },
            })

        })

    })

})

