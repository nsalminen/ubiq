const { write, appendFileSync } = require("fs");
const { nextTick } = require("process");
const { Stream, EventEmitter, Writable } = require("stream");
const { NetworkId, Message } = require("../../ubiq/messaging");
const wav = require("wav");
const { throws } = require("assert");
const spawn = require("child_process").spawn;

class TextGenerationService extends EventEmitter {
    constructor(scene) {
        super();
        this.objectId = new NetworkId(96);
        this.componentId = 96;
        this.audioData = Buffer.alloc(0);

        this.context = scene.register(this);
        this.registerRoomClientEvents();
        this.pythonProcess = null;
        this.resultRegex = /text="([^"]*)"/;

        this.start(true);
    }

    start(broadcastResults = false) {
        this.pythonProcess = spawn("python", ["-u", "../text_generation/text_2_chatgpt.py"]);
        this.pythonProcess.stdout.on("data", (data) => {
            if (broadcastResults) {
                var response = data.toString();
                if (response.length > 0) {
                    this.sendResponse(response);
                }
            }
        });
    }

    sendResponse(data) {
        for (const peer of this.roomClient.getPeers()) {
            this.context.send(peer.networkId, this.componentId, { type: "text generated", peer: "TODO", data: data });
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
    TextGenerationService,
};
