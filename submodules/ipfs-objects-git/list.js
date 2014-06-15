var fs = require('fs')
var ipfsObject = require('../ipfs-object')
var protobuf = require('ipfs-protobuf-codec')
var multihash = require('multihashes')

module.exports = List

// a list holds: [ <link to list or object>, ... ]
function List(data) {
  if (!(this instanceof List))
    return new List(data)

  // if array, assume [ object, ... ]  or [ multihash Buffer, ... ]
  if (Array.isArray(data))
    data = listArrayToData(data)

  // need to encode list data?
  if (data.data && Array.isArray(data.data.items))
    data.data = List.codec.encode(data.data)

  // todo: validate data
  ipfsObject.call(this, data)
}

ipfsObject.inherits(List)


// turn data an array of ipfsObjects into corresponding list data
function listArrayToData(array) {
  var links = {}
  var indices = []
  var obj = { links: [] }

  for (var i in array) {
    var item = array[i]

    // not an ipfs object? bail.
    if (typeof(item.multihash) != 'function')
      throw new Error("TypeError: list item not object or multihash. " + item)

    var hash = item.multihash()

    // no link yet available? add it.
    if (!links[hash]) {
      links[hash] = obj.links.length // setup index.
      obj.links.push(item.link())
    }

    indices.push(links[hash]) // add index
  }
  obj.data = { items: indices }
  return obj
}

var src = fs.readFileSync(__dirname + '/git-objects.proto', 'utf-8')
List.codec = protobuf.fromProtoSrc(src).List
