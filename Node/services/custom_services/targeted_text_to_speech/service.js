const { TextToSpeechService } = require('../../text_to_speech/service');
const spawn = require("child_process").spawn;


class TargetedTextToSpeechService extends TextToSpeechService {
    constructor(scene, broadcastResults = false) {
        super(scene, broadcastResults);
        // Create a queue of peer names to send audio to
        this.targetPeerQueue = [];
    }

    start() {
        this.pythonProcess = spawn("python", [
            "-u",
            "../../services/text_to_speech/text_to_speech_azure.py"
        ]);
        this.pythonProcess.stdout.on("data", (data) => {
            if (this.broadcastResults) {
                this.audioData = Buffer.concat([this.audioData, data]);
                this.sendAudioInfoHeader(data.length);
                this.sendAudioData();
            }
        });
    }

    sendAudioData() {
        // For each peer, send the audio data in chunks of 1024 bytes
        while (this.audioData.length > 0) {
            console.log("Sending audio data to peers. Audio data length: " + this.audioData.length + " bytes");
            this.context.send(this.networkId, this.audioData.slice(0, 16000));
            this.audioData = this.audioData.slice(16000);
        }
    }

    sendAudioInfoHeader(audioLength) {
        // Send the audio info header to the target peer
        var targetPeer = this.targetPeerQueue.shift();
        for (const peer of this.roomClient.getPeers()) {
            console.log('send audio info header');
            this.context.send(peer.sceneid, {
                type: "AudioInfo",
                targetPeer: targetPeer,
                audioLength : audioLength
            });
        }
    }

    processLocalMessage(msg, targetPeer = null) {
        this.targetPeerQueue.push(targetPeer);

        if (this.pythonProcess) {
            this.pythonProcess.stdin.write(msg + "\n");
        }
    }
}

module.exports = {
    TargetedTextToSpeechService,
};
