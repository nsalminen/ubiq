const { write, appendFileSync } = require("fs");
const { nextTick } = require("process");
const { Stream, EventEmitter, Writable } = require("stream");
const { NetworkId, Message } = require("../../ubiq/messaging");
const wav = require("wav");
const { throws } = require("assert");
const spawn = require("child_process").spawn;
const { LogCollectorMessage } = require("../../ubiq/logcollector");

class TextToSpeechService extends EventEmitter {
    constructor(scene) {
        super();
        this.objectId = new NetworkId(95);
        this.componentId = 95;
        this.audioData = Buffer.alloc(0);

        this.context = scene.register(this);
        this.registerRoomClientEvents();
        this.pythonProcess = null;

        // Dictionary of peer uuids and their last message including time
        this.lastPeerSelection = {};

        this.start(false);
    }

    start(broadcastResults = false) {
        this.pythonProcess = spawn("python", [
            "-u",
            "../../services/text_to_speech/text_to_speech_azure.py"
        ]);
        this.pythonProcess.stdout.on("data", (data) => {
            // console.log("Message from python:");
            // console.log("data: " + data.toString());
            this.audioData = Buffer.concat([this.audioData, data]);
            this.sendAudioData();
            // for (const peer of this.roomClient.getPeers()) {
            //     this.context.send(peer.networkId, this.componentId, this.audioData);
            // }
            if (broadcastResults) {
                var response = data.toString();
                if (response.split(".").pop() == "png") {
                    this.sendResponse(response);
                }
            }
        });
        // Wait 2 seconds before sending the first message
        setTimeout(() => this.sendHello(), 1000);
        // setTimeout(() => this.sendHello(), 1000);
        // setTimeout(() => this.sendHello(), 100);
    }

    sendAudioData() {
        // For each peer, send the audio data in chunks of 1024 bytes
        while (this.audioData.length > 0) {
            console.log("Sending audio data to peers. Audio data length: " + this.audioData.length + " bytes");
            for (const peer of this.roomClient.getPeers()) {
                this.context.send(peer.networkId, this.componentId, this.audioData.slice(0, 16000));
                this.audioData = this.audioData.slice(16000);
            }
        }
    }
    
    sendHello() {
        this.pythonProcess.stdin.write("This is a test.\n");
    }

    sendResponse(data) {
        for (const peer of this.roomClient.getPeers()) {
            this.context.send(peer.networkId, this.componentId, {
                type: "texture generated",
                peer: "TODO",
                data: data,
            });
        }
    }

    registerRoomClientEvents() {
        this.roomClient = this.context.scene.findComponent("RoomClient");
        // if (this.roomClient == undefined) {
        //     throw "RoomClient must be added to the scene before AudioCollector";
        // }
        // this.roomClient.addListener(
        //     "OnPeerAdded",
        //     function () {
        //         console.log("AudioCollector OnPeerAdded");
        //     }.bind(this)
        // );

        // this.roomClient.addListener(
        //     "OnPeerRemoved",
        //     function () {
        //         console.log("AudioCollector OnPeerRemoved");
        //     }.bind(this)
        // );
    }

    execute(msg) {
        //maybe local process message
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
