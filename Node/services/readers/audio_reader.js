const { Readable } = require('stream');
const { NetworkId } = require("../../ubiq/messaging");

class PeerAudioReader extends Readable {
    constructor(scene, networkId, config = {}) {
        super();
        this.config = config;

        if (networkId == undefined) {
            throw new Error(`NetworkId must be defined for service: ${this.name}`);
        }

        this.objectId = new NetworkId(networkId);
        this.componentId = networkId;

        this.context = scene.register(this);
        // this._buffer = Buffer.alloc(0);
    }

    // This method is called when a new chunk of data is available to be read. The msg.message is a Buffer object.
    processMessage(msg) {
        // Length of the message is always 1060 bytes
        // this._buffer = Buffer.concat([this._buffer, msg.message]);
        // console.log("buffer length", this._buffer.length);
        this.push(msg.message);
        // Check if we paused the stream
        if (this.isPaused()) {
            console.log("stream paused");
        }

        // Check if we reached the highWaterMark
        if (this._readableState.length >= this._readableState.highWaterMark) {
            console.log("highWaterMark reached");
        }
    }

    // This method is called when the stream needs to read more data.
    _read(size) {
        // If there's data in the buffer, push it to the stream.
        // if (this._buffer.length > 0) {
        //     const chunk = this._buffer.slice(0, size);
        //     this._buffer = this._buffer.slice(size);
        //     this.push(chunk);
        // }
    }
}

module.exports = { PeerAudioReader }