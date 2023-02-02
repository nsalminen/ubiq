const { NetworkId, Message } = require("../../ubiq/messaging");
const spawn = require("child_process").spawn;

class MusicGenerationService {
    constructor(scene, broadcastResults = false) {
        this.objectId = new NetworkId(90);
        this.componentId = 90;
        
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
            "../../services/music_generation/text_2_music.py",
            "--output_folder",
            "../../apps/music_generation/data",
            "--prompt_postfix",
            "groove, 80s, melodic"
        ]);
        this.pythonProcess.stdout.on("data", (data) => {
            if (this.broadcastResults) {
                var response = data.toString();
                if (response.split(".").pop() == "mp3") {
                    this.sendResponse(response);
                }
            }
        });
    }

    sendResponse(peer, data) {
        for (const peer of this.roomClient.getPeers()) {
            this.context.send(peer.networkId, this.componentId, {
                type: "recognizedText",
                peer: peer.uuid,
                data: data,
            });
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
    MusicGenerationService,
};
