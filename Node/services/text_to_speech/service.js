const { NetworkId, Message } = require("../../ubiq");
const spawn = require("child_process").spawn;

class TextToSpeechService {
    constructor(scene, broadcastResults = false) {
        this.networkId = new NetworkId(95);
        this.audioData = Buffer.alloc(0);

        this.context = scene.register(this);
        this.registerRoomClientEvents();
        this.pythonProcess = null;
        this.broadcastResults = broadcastResults;

        // Dictionary of peer uuids and their last message including time
        this.lastPeerSelection = {};

        this.start();
    }

    start() {
        this.pythonProcess = spawn("python", [
            "-u",
            "../../services/text_to_speech/text_to_speech_azure.py"
        ]);
        this.pythonProcess.stdout.on("data", (data) => {
            if (this.broadcastResults) {
                this.audioData = Buffer.concat([this.audioData, data]);
                this.sendAudioData();
            }
        });
    }

    sendAudioData() {
        // For each peer, send the audio data in chunks of 16000 bytes
        while (this.audioData.length > 0) {
            // console.log("Sending audio data to peers. Audio data length: " + this.audioData.length + " bytes");
            this.context.send(this.networkId, this.audioData.slice(0, 16000));
            this.audioData = this.audioData.slice(16000);
        }
    }

    registerRoomClientEvents() {
        this.roomClient = this.context.scene.findComponent("RoomClient");
    }

    processLocalMessage(msg) {
        if (this.pythonProcess) {
            this.pythonProcess.stdin.write(msg + "\n");
        }
    }

    processMessage(msg) {}

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
    TextToSpeechService,
};
