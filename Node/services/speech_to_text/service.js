const wav = require("wav");
const { Service } = require("../../../Genie/service");

class SpeechToTextService extends Service {
    constructor(scene, broadcastOutput = false, writeOutputToFile = false, config = {}) {
        super(scene, 98, "SpeechToText", config);
        this.registerRoomClientEvents();

        this.writeOutputToFile = writeOutputToFile;
        this.audioData = Buffer.alloc(0);

        if (this.writeOutputToFile) {
            this.writer = new wav.FileWriter("audio.wav", {
                channels: 1, // Number of channels (1 for mono, 2 for stereo)
                sampleRate: 16000, // Sample rate in Hz
                bitDepth: 16, // Bit depth (16 for G722)
            });
        }

        if (broadcastOutput) {
            this.on("response", (data, identifier) => {
                this.sendResponseToAllPeers(data, identifier);
            });
        }
    }

    // Send a response to all peers in the room
    sendResponseToAllPeers(data, identifier) {
        for (const peer of this.roomClient.getPeers()) {
            console.log("Sending response to peer " + peer.uuid + ": " + data.toString());
            this.context.send(peer.networkId, this.componentId, {
                type: "recognizedText",
                peer: identifier,
                data: data.toString(),
            });
        }
    }

    // Register events to create a transcription process for each peer. These processes are killed when the peer leaves the room.
    registerRoomClientEvents() {
        if (this.roomClient == undefined) {
            throw "RoomClient must be added to the scene before AudioCollector";
        }

        this.roomClient.addListener(
            "OnPeerAdded",
            function (peer) {
                console.log("Starting speech-to-text process for peer " + peer.uuid);
                this.registerChildProcess(peer.uuid, "python", [
                    "-u",
                    "../../services/speech_to_text/transcribe_azure.py",
                    "--key",
                    this.config.credentials.azureSpeech.key,
                    "--region",
                    this.config.credentials.azureSpeech.region,
                ]);
            }.bind(this)
        );

        this.roomClient.addListener(
            "OnPeerRemoved",
            function (peer) {
                if (this.writeOutputToFile) {
                    this.writer.end();
                }
                console.log("Ending speech-to-text process for peer " + peer.uuid);
                this.killChildProcess(peer.uuid);
            }.bind(this)
        );
    }

    // Override the default processMessage function to handle audio data.
    // This should later be replaced with a solution that uses NodeJS streams.
    processMessage(msg) {
        this.audioData = Buffer.concat([this.audioData, msg.message]);
        while (this.audioData.length >= 1060) {
            // Slice the first 36 bytes from the audioData buffer (the peer UUID)
            const peer_uuid = this.audioData.subarray(0, 36);

            // Slice the next 1024 bytes from the audioData buffer (the audio chunk)
            const chunk = this.audioData.subarray(36, 1060);

            // Write the chunk to the WAV file if writeOutputToFile is true
            if (this.writeOutputToFile) {
                this.writer.write(chunk);
            }

            // Remove the data from the audioData buffer
            this.audioData = this.audioData.subarray(1060);

            // Send data to the child Python process. We end with a newline character to indicate the end of the message.
            this.sendToChildProcess(peer_uuid, JSON.stringify(chunk.toJSON()) + "\n");
        }
    }
}

module.exports = {
    SpeechToTextService,
};
