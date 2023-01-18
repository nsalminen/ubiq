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
    constructor(scene) {
        super();
        this.objectId = new NetworkId(98);
        this.componentId = 98;
        this.audioData = Buffer.alloc(0);

        this.context = scene.register(this);
        this.registerRoomClientEvents();
        this.pythonProcess = null;
        this.resultRegex = /text="([^"]*)"/;
    }

    start(broadcastResults = false) {
        this.pythonProcess = spawn("python", ["-u", "../../services/speech_to_text/transcribe_azure.py"]);
        this.pythonProcess.stdout.on("data", (data) => {
            if (broadcastResults) {
                var response = data.toString();
                if (response.startsWith("RECOGNIZED: ")) {
                    let match = this.resultRegex.exec(response);
                    if (match[1]) {
                        this.sendResponse(match[1]);
                    }
                }
            }
        });
    }

    sendResponse(data) {
        for (const peer of this.roomClient.getPeers()) {
            this.context.send(peer.networkId, this.componentId, { type: "recognizedText", peer: "TODO", data: data });
        }
    }

    registerRoomClientEvents() {
        this.roomClient = this.context.scene.findComponent("RoomClient");
        if (this.roomClient == undefined) {
            throw "RoomClient must be added to the scene before AudioCollector";
        }
        this.roomClient.addListener(
            "OnPeerAdded",
            function () {
                console.log("AudioCollector OnPeerAdded");
            }.bind(this)
        );

        this.roomClient.addListener(
            "OnPeerRemoved",
            function () {
                writer.end();
                console.log("AudioCollector OnPeerRemoved");
            }.bind(this)
        );
    }

    processMessage(msg) {
        this.audioData = Buffer.concat([this.audioData, msg.message]);

        while (this.audioData.length >= 256) {
            // Slice the first 256 bytes from the audioData buffer
            const chunk = this.audioData.slice(0, 256);

            // Write the chunk to the local audio file
            // appendFileSync('audio.g722', chunk);

            // Write the chunk to the WAV file
            // writer.write(chunk);

            // Remove the chunk from the audioData buffer
            this.audioData = this.audioData.slice(256);
            // console.log(JSON.stringify(chunk.toJSON()))
            // JSON.stringify(bufferOne);
            // Send data to the child Python process's stdin
            if (this.pythonProcess) {
                this.pythonProcess.stdin.write(JSON.stringify(chunk.toJSON()) + "\n");
            }
        }
    }

    onResponse(cb) {
        if (this.pythonProcess) {
            this.pythonProcess.stdout.on("data", (data) => cb(data.toString()));
        }
    }

    onError(cb) {
        if (this.pythonProcess) {
            this.pythonProcess.stderr.on("data", (data) => cb(data));
        }
    }
}

module.exports = {
    TranscriptionService,
};
