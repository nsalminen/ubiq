const { NetworkId, Message } = require("../../ubiq/messaging");
const spawn = require("child_process").spawn;

class ImageGenerationService {
    constructor(scene, broadcastResults = false) {
        this.objectId = new NetworkId(97);
        this.componentId = 97;
        this.audioData = Buffer.alloc(0);

        this.context = scene.register(this);
        this.registerRoomClientEvents();
        this.pythonProcess = null;

        // Dictionary of peer uuids and their last message including time
        this.lastPeerSelection = {};
        this.broadcastResults = broadcastResults;

        this.start();
    }

    start() {
        this.pythonProcess = spawn("python", [
            "-u",
            "../../services/image_generation/text_2_image.py",
            "--output_folder",
            "../../apps/texture_generation/data",
            "--prompt_postfix",
            ", 4k"
        ]);
        this.pythonProcess.stdout.on("data", (data) => {
            if (this.broadcastResults) {
                var response = data.toString();
                console.log("Received response from python process: " + response)
                if (response.split(".").pop() == "png") {
                    this.sendResponse(response);
                }
            }
        });
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
                console.log("AudioCollector OnPeerRemoved");
            }.bind(this)
        );
    }

    processLocalMessage(prompt, output_file) {
        // Create dictionary from prompt and output_file
        var msg = JSON.stringify({
            prompt: prompt,
            output_file: output_file,
        });
        if (this.pythonProcess) {
            console.log("Sending message to python process: " + msg);
            this.pythonProcess.stdin.write(msg + "\n")
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
    ImageGenerationService,
};
