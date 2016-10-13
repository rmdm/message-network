module.exports = Net

function Net () {
    if (!(this instanceof Net)) {
        return new Net()
    }

    this.nodes = {}
}

Net.prototype.connect = function (name, node, options) {
    this.nodes[name] = node
}

Net.prototype.node = function (name) {
    return this.nodes[name]
}

Net.prototype.names = function (node) {
    var names = []
    for (var name in this.nodes) {
        if (this.nodes[name] === node) {
            names.push(name)
        }
    }
    return names
}
