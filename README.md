message-network
===

Highly scalable, modular, flexible, lightweight and performant solution for
evented interactions.

Description
===

**message-network** allows you to build a networks of nodes that can interact by
sending events to each other. **message-network** defines two models of
interaction: _request-response_ and _notification_. The difference between the
two is that _request-response_, as its name implies, allows one node to ask
another one for response, whilist _notification_ is fire-and-forget interaction,
no response is expected or waited for. For an interaction to occur both sides of
the interaction have to declare theirs participation. By default no nodes is
listening on events (though some nodes may emit events by default). Hence no
interaction occurs by default. An event can be sent to one (unicast event),
many (multicast event) or all (broadcast event) nodes of a network.

Event networks can be combined by using _gates_. A gate is a special kind of
a network node. This nodes, when receive events, pass them to gate nodes of
another networks which in turn emit them into destination network. Networks by
itself does not have names but by using (always) named gates they can refer to
other networks (including itself) by that names. It is possible to transparently
connect networks residing on different devices which makes **event-networks** a
good basement for scalable architectures also.

Installation
===

```npm install message-network```

Documentation
===

* [enet.Net](#enetnet)
  * connect
  * disconnect
  * reconnect
  * node
  * request
* enet.Node
* enet.Gate
* enet.MemoryGate
* enet.Request
* enet.Notification
* enet.TimeoutError

## enet.Net()

### Net.prototype.connect (name, node, [options]) => Net

Connects a **node** to the network under specified **name**. A network cannot
have more than one connected **node** under the same **name**. A **node** can be
connected to multiple event networks. A **node** can be connected to the
same network under different names. A **node** can be connected at any time.

In place of **node** can be passed an instance of one of the following classes:

* **enet.Node**
* **enet.Net**
* **EventEmitter**
* JavaScript Object

Instances of **enet.Node** is used as is. Passing an instance of **enet.Net** is
an implicit way to create a gate node under specified **name** into another
_in-memory_ event network, in this case an option **options.gateName** is
required and represents node name under which gate would be registered on the
passed network. Intances of other classes would be extended with methods of
**enet.Node.prototype**. Instances of **EventEmitter** may emit _notifications_
(not _requests_) into a network if an option **options.events** is passed.
**options.events** is an array of event names that needs to be directed into
network.

### Net.prototype.disconnect (name) => Net

Disconnects a node under specified **name** from the network.

### Net.prototype.reconnect (name, node [options]) => Net

The result is equivalent to the sequence of calls of methods
**Net.prototype.disconnect** and **Net.prototype.connect**.

### Net.prototype.node (name) => Node

Returns a node under specified **name**.

### Net.prototype.names (node) => String[]

Returns a **node** names under which it is registered in the network.

### Net.prototype.request () => Net

### Events

#### 'request'

Emitted each time a request is issued by some node of the network.

#### 'response'

Emitted when a node responds on a request.

#### 'notification'

Emitted each time a notification is emitted by some node of the network.

## enet.Node()

### Node.prototype.request (params) => Request

Sends a request to nodes specified by passed **params**.

**params** are:

* **gate** - names of gates to which to send request to, optional, defaults to
nothing, which means that request is to some node of the network. **'*'** is a
possible value, which means all known gates (not nodes) of the network would be
requested.
* **node** - names of nodes to which to send request to, required,
**'*'** is possible value, which means broadcast request to all nodes of the
network except for gates.
* **action** - names of requested actions, required, value '*' has no special
meaning.
* **data** - arbitrary data, optional.
* **callback** - listener of the returned **net.Request** instance on 'response'
event, optional.

### Node.prototype.notify (params) => Notification

Sends a notification to nodes specified by passed **params**.

**params** are:

* **gate** - names of gates to which to send notification to, optional,
defaults to nothing, which means that notification is to some node of the
network. **'*'** is a possible value, which means all known gates (not nodes) of
the network would be notified.
* **node** - names of nodes to which to send notification to, required,
**'*'** is a possible value, which means broadcast notification of all nodes of
the network except for gates.
* **event** - names of notification events, required, value '*' has no special
meaning.
* **data** - arbitrary data, optional.

### Node.prototype.action (params) => Node

Registers a listener on a request from nodes specified by passed **params**.

**params** are:

* **gate** - names of gates from which to listen on requests, optional,
defaults to nothing, which means that action can be requested from nodes of the
current network (or networks) only. **'*'** is possible value, which means all
known gates of the network would be listened.
* **node** - names of nodes on which to listen on requests, required,
**'*'** is a possible value, which means listening on broandcast requests from
nodes (not gates).
* **action** - names of request actions, required, value '*' has no special
meaning.
* **handler** - function called on each incoming request.

### Node.prototype.listen (params) => Node

Registers listener on a notification from nodes specified by passed **params**.

**params** are:

* **gate** - names of gates from which to listen to notifications, optional,
defaults to nothing, which means that notification can be sent from nodes of the
current network (or networks) only. **'*'** is possible value, which means all
known gates of the network would be listened.
* **node** - names of nodes on which to listen to notifications, required,
**'*'** is a possible value, which means listening on broandcast notifications
from nodes (not gates).
* **event** - names of notification events, required, value '*' has no special
meaning.
* **handler** - function called on each incoming notification.

### Node.prototype.cancelAction (params) => Node

Remove request action handler, specified by passed **params**.

**params** are the same as for **Node.prototype.action** method.

### Node.prototype.stopListen (params) = > Node

Remove event notification handler, specified by passed **params**.

**params** are the same as for **Node.prototype.listen** method.

## enet.Gate()

Extends **enet.Node** class. Includes specific implementation for inter-network
event passing.

## enet.MemoryGate()

Extends **enet.Gate** class. Includes specific implementation for inter-network
event passing for the networks in the same memory.

## enet.Request ()

### Events

#### 'response'

## enet.Notification ()

## enet.TimeoutError ()

Thrown when a request is not responded within timeout.

## enet.UnreachableNodeError ()

Thrown when sending new request or notification to destination node when that
node does not exist.

Examples
===









There are two ways to combine event networks.
First, by using networks as nodes of another networks. When a network is used as
a node, such a network is called a _subnet_ and such a node is called a
_subnet node_. An event network containing a subnet is called its _supernet_.
A subnet node broadcasts all incoming events into subnet. In turn, subnet's
broadcast events is emmited into supernet from subnet node.
