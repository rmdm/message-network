'use strict'

import assert from 'assert'
import sinon from 'sinon'

import Net from '../../lib/Net'
import Node from '../../lib/Node'
import Gate from '../../lib/Gate'
import MemoryGate from '../../lib/MemoryGate'

import { BaseError, DisconnectedError, TimeoutError } from '../../lib/errors'

import { EventEmitter } from 'events'

describe('Net class', function () {

    var net, node, gate

    beforeEach(function () {
        net = Net()
        node = Node()
        gate = Gate()
    })

    describe('constructor', function () {

        it('returns an instance of Net class when called as a function', function () {
            assert(net instanceof Net)
        })

        it('returns an instance of Net class when called as a constructor', function () {
            var net = new Net()
            assert(net instanceof Net)
        })

    })

    describe('node method', function () {

        it('returns a connected node of the network by its name', function () {
            net.connect('node', node)

            var result = net.node('node')

            assert.equal(result, node)
        })

        it('returns null when a node is not connected to the network', function () {
            var netNode = net.node('node')

            assert.strictEqual(netNode, null)
        })

    })

    describe('names method', function () {

        it('returns a connected node names of the network by node', function () {
            net.connect('node', node)
            net.connect('another-node', node)
            net.connect('one-more-node', {})

            var names = net.names(node).sort()

            assert.deepEqual(names, ['another-node', 'node'])
        })

    })

    describe('connect method', function () {

        it('connects a Node instance node', function () {
            net.connect('node', node)
            var netNode = net.node('node')

            assert.equal(netNode, node)
        })

        it('connects a Gate instance node', function () {
            net.connect('gate', gate)

            assert.equal(net._gates['gate'], gate)
        })

        it('registers listener on a node "listen" event, which calls "listen" ' +
            'method of the net with "as" parameter set to node "name"', function () {
            var listen = sinon.stub(net, 'listen')

            net.connect('node', node)

            node.listen()

            assert(listen.called)
        })

        it('registers listener on a node "send" event, which calls "send" ' +
            'method of the net with "as" parameter set to node "name"', function () {
            var send = sinon.stub(net, 'send')

            net.connect('node', node)

            node.send()

            assert(send.calledWithMatch({as: 'node'}))
        })

        it('registers listener on a node "unlisten" event, which calls "unlisten" ' +
            'method of the net with "as" parameter set to node "name"', function () {
            var unlisten = sinon.stub(net, 'unlisten')

            net.connect('node', node)

            node.unlisten()

            assert(unlisten.calledWithMatch({as: 'node'}))
        })

        it('links to another net through MemoryGate if passed node is of Net type', function () {
            var anotherNet = Net()

            net.connect('node', anotherNet, {remoteGateName: 'gate'})

            var netGate = net.node('node')
            var anotherNetGate = anotherNet.node('gate')

            assert(netGate instanceof MemoryGate)
            assert(anotherNetGate instanceof MemoryGate)
            assert.equal(netGate._endpoint, anotherNetGate)
            assert.equal(anotherNetGate._endpoint, netGate)
        })

        it('retriggers events of passed node into net if it is of EventEmitter type', function () {
            var send = sinon.stub(net, 'send')
            var ee = new EventEmitter()

            net.connect('node', ee, {events: ['event']})

            ee.emit('event', 'data')

            assert(send.calledWithMatch({
                as: 'node',
                to: '*',
                topic: 'event',
                data: 'data',
            }))
        })

        it('wraps passed node with Node constructor if the node is not of Node type', function () {
            net.connect('node', {iamnode: true})

            var netNode = net.node('node')

            assert(netNode instanceof Node)
            assert.equal(netNode.iamnode, true)
        })

        it('returns a network itself', function () {
            var network = net.connect('node', node)

            assert.equal(network, net)
        })

        it('throws when connecting a node under an already used name', function () {
            var anotherNode = Node()

            net.connect('node', node)

            assert.throws(function () {
                net.connect('node', anotherNode)
            })
        })

        it('throws when a node name is not a string', function () {
            assert.throws(function () {
                net.connect(1000, node)
            })
        })

        it('throws when a node is not an object', function () {

            assert.throws(function () {
                net.connect('node', 10)
            })
        })

        it('throws when a node name is "*"', function () {
            assert.throws(function () {
                net.connect('*', node)
            })
        })

        it('throws when a node name is ""', function () {
            assert.throws(function () {
                net.connect('', node)
            })
        })

    })

    describe('disconnect method', function () {

        it('disconnects a node from a network', function () {
            net.connect('node', node)
            net.disconnect('node')
            var netNode = net.node('node')

            assert.equal(netNode, null)
        })

        it('removes effects set by "connect"', function () {
            var listen = sinon.stub(net, 'listen')
            var send = sinon.stub(net, 'send')
            var unlisten = sinon.stub(net, 'unlisten')

            net.connect('gate', gate)
            net.disconnect('gate')

            gate.listen()
            gate.send()
            gate.unlisten()

            assert(!net._nodes['gate'])
            assert(!net._gates['gate'])
            assert(!net._listeners['gate'])
            assert(!listen.called)
            assert(!send.called)
            assert(unlisten.calledWithMatch({
                to: '*',
            }))
        })

        it('returns a network itself', function () {
            net.connect('node', node)
            var network = net.disconnect('node')

            assert.equal(network, net)
        })

    })

    describe('reconnect method', function () {

        it('disconnects a node from a network and connects another one to it', function () {
            var anotherNode = Node()

            net.connect('node', node)
            net.reconnect('node', anotherNode)
            var netNode = net.node('node')

            assert.equal(netNode, anotherNode)
            assert.notEqual(netNode, node)
        })

        it('returns a network itself', function () {
            var network = net.reconnect('node', node)

            assert.equal(network, net)
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
                success: function (data, context) {
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
                            assert(error instanceof DisconnectedError)
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
                success: function (data, context) {
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
                            assert(error instanceof DisconnectedError)
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
                success: function (data, context) {
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
                                assert(error instanceof DisconnectedError)
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

            net1.connect('net1', net2, {remoteGateName: 'net2'})

            node2.listen({
                to: {
                    gate: 'net2',
                    node: 'node1',
                },
                topic: 'ololo',
                success: function (data, context) {
                    assert.equal(data, 1)
                    context.reply(data * 10)
                }
            })

            net1.node('net1').listen({
                to: 'node1',
                topic: 'ololo',
            })

            node1.send({
                to: {
                    gate: 'net1',
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

            net1.connect('net2', net2, {remoteGateName: 'net1'})

            var chat = []

            node2.listen({
                to: {
                    gate: 'net1',
                    node: 'node1',
                },
                topic: 'ololo',
                success: function (data, context) {
                    chat.push({
                        data: data,
                        node: 'node2',
                        sender: context.sender,
                    })
                    context.reply(++data)
                }
            })

            net1.node('net2').listen({
                to: 'node1',
                topic: 'ololo',
            })

            node1.send({
                to: {
                    gate: 'net2',
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
                success: function () {
                    assert.deepEqual(chat, [
                        { data: 1, node: 'node2', sender: {gate: 'net1', node: 'node1'} },
                        { data: 2, node: 'node1', sender: {gate: 'net2', node: 'node2'} },
                        { data: 3, node: 'node2', sender: {gate: 'net1', node: 'node1'} },
                        { data: 4, node: 'node1', sender: {gate: 'net2', node: 'node2'} },
                        { data: 5, node: 'node2', sender: {gate: 'net1', node: 'node1'} },
                        { data: 6, node: 'node1', sender: {gate: 'net2', node: 'node2'} },
                    ])
                    done()
                },
            })

        })

        it('expires request inter-network timeout', function (done) {

            var net1 = Net()
            var net2 = Net()

            var node1 = Node()
            var node2 = Node()

            net1.connect('node1', node1)
            net2.connect('node2', node2)
            net1.connect('net2', net2, {remoteGateName: 'net1'})

            net1.node('net2').listen({
                to: 'node1',
                topic: 'request',
            })

            node2.listen({
                to: {
                    gate: 'net1',
                    node: 'node1',
                },
                topic: 'request',
                success: function (data, context) {
                    setTimeout(function () {
                        context.reply()
                    }, 20)
                }
            })

            node1.send({
                to: {
                    gate: 'net2',
                    node: 'node2',
                },
                topic: 'request',
                data: 10,
                error: function (err, context) {
                    assert.equal(err.name, 'TimeoutError')
                    assert.deepEqual(context.sender, {
                        gate: 'net2',
                        node: 'node2',
                    })
                    done()
                },
                options: {
                    timeout: 10,
                }
            })

        })

    })

})

