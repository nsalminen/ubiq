const { write, appendFileSync } = require("fs");
const { nextTick } = require("process");
const { Stream, EventEmitter, Writable } = require("stream");
const { NetworkId, Message } = require("../../ubiq/messaging");
const wav = require("wav");
const { throws } = require("assert");
const spawn = require("child_process").spawn;

const writer = new wav.FileWriter("audio.wav", {
    channels: 1, // Number of channels (1 for mono, 2 for stereo)
    sampleRate: 16000, // Sample rate in Hz
    bitDepth: 16, // Bit depth (16 for G722)
});

class TranscriptionService extends EventEmitter {
    constructor(scene, broadcastResults = false) {
        super();
        this.objectId = new NetworkId(98);
        this.componentId = 98;
        this.audioData = Buffer.alloc(0);

        this.context = scene.register(this);
        this.registerRoomClientEvents();
        this.pythonProcesses = [];
        this.broadcastResults = broadcastResults;
        this.onResponseCallbacks = [];
    }

    sendResponse(peer_uuid, data) {
        for (const peer of this.roomClient.getPeers()) {
            this.context.send(peer.networkId, this.componentId, {
                type: "recognizedText",
                peer: peer_uuid,
                data: data,
            });
        }
    }

    spawnProcessForPeer(peer) {
        console.log("Spawning speech-to-text process for peer " + peer);
        this.pythonProcesses[peer] = spawn("python", [
            "-u",
            "../../services/speech_to_text/transcribe_azure.py",
            "--peer",
            peer,
        ]);
        this.pythonProcesses[peer].stdout.on("data", (data) => {
            if (this.broadcastResults) {
                var response = data.toString();
                if (response.startsWith(">")) {
                    response = response.slice(1); // Slice off the leading '>' character
                    this.sendResponse(peer, response);
                }
            }
        });

        // Register the new peer's process with all existing callbacks
        for (let i = 0; i < this.onResponseCallbacks.length; i++) {
            this.pythonProcesses[peer].stdout.on("data", (data) => this.onResponseCallbacks[i](data, peer));
        }
    }

    registerRoomClientEvents() {
        this.roomClient = this.context.scene.findComponent("RoomClient");
        if (this.roomClient == undefined) {
            throw "RoomClient must be added to the scene before AudioCollector";
        }
        this.roomClient.addListener(
            "OnPeerAdded",
            function (peer) {
                this.spawnProcessForPeer(peer.uuid);
            }.bind(this)
        );
        this.roomClient.addListener(
            "OnPeerRemoved",
            function (peer) {
                writer.end();
                console.log("Ending speech-to-text process for peer " + peer.uuid);
                this.pythonProcesses[peer.uuid].kill();
            }.bind(this)
        );
    }

    processMessage(msg) {
        this.audioData = Buffer.concat([this.audioData, msg.message]);
        // console.log("AudioCollector received " + msg.message.length + " bytes of audio data");
        while (this.audioData.length >= 1060) {
            // Slice the first 36 bytes from the audioData buffer (the peer UUID)
            const peer_uuid = this.audioData.slice(0, 36);

            // Slice the next 1024 bytes from the audioData buffer (the audio chunk)
            const chunk = this.audioData.slice(36, 1060);

            // Write the chunk to the local audio file
            // appendFileSync('audio.g722', chunk);

            // Write the chunk to the WAV file
            // writer.write(chunk);

            // Remove the data from the audioData buffer
            this.audioData = this.audioData.slice(1060);

            // Send data to the child Python process's stdin
            if (this.pythonProcesses[peer_uuid]) {
                this.pythonProcesses[peer_uuid].stdin.write(JSON.stringify(chunk.toJSON()) + "\n");
            } else {
                console.error("No speech-to-text process for peer " + peer_uuid);
            }
        }
    }

    onResponse(cb) {
        for (const peer of this.roomClient.getPeers()) {
            this.pythonProcesses[peer.uuid].stdout.on("data", (data) => cb(data, peer));
        }

        // Save the callback so that it can be registered with new peers
        this.onResponseCallbacks.push(cb);
    }

    onError(cb) {
        for (const peer of this.roomClient.getPeers()) {
            this.pythonProcesses[peer.uuid].stdout.on("data", (data) => cb(data, peer));
        }
    }
}

module.exports = {
    TranscriptionService,
};
