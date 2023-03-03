const { Readable } = require('stream');
const { NetworkId } = require("../Node/ubiq/messaging");

class MessageReader extends Readable {
    constructor(scene, networkId, config = {}) {
        super();
        this.config = config;

        if (networkId == undefined) {
            throw new Error(`NetworkId must be defined for service: ${this.name}`);
        }
        
        this.objectId = new NetworkId(networkId);
        this.componentId = networkId;
        this.context = scene.register(this);
    }

    // This method is called when a new chunk of data is available to be read. The msg.message is a Buffer object.
    processMessage(msg) {
        this.push(msg.message);
    }

    _read(size) {
        // We don't need to do anything here as we are pushing data to the stream in processMessage.
    }
}

module.exports = { MessageReader }