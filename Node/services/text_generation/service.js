const { NetworkId, Message } = require("../../ubiq");
const spawn = require("child_process").spawn;

class TextGenerationService {
    constructor(scene) {
        this.networkId = new NetworkId(96);
        this.audioData = Buffer.alloc(0);

        this.context = scene.register(this);
        this.registerRoomClientEvents();
        this.pythonProcess = null;

        this.start(true);
    }

    start(broadcastResults = false) {
        // this.pythonProcess = spawn("python", ["-u", __dirname + "\\text_2_chatgpt_rev.py", "--preprompt", "You are a participant in a multi-party conversation. There can be any amount of people in the room, including you. Your name is 'Agent’. Every response should be prefixed with the speaker’s name, an arrow, the person who is spoken to and a colon (e.g., 'Dizzy Cat -> Agent: …’). If you speak to everyone in the room, use 'Everyone’ as a target. You can only speak from the Agent’s perspective, so your response always starts with 'Agent ->'. Remember each person that speaks to you (these are the people in the room). Wait for someone to start speaking. Do not speak for others, only from the perspective of yourself, Agent. Respond as concisely as possible, but stay polite."]);
        this.pythonProcess = spawn("python", ["-u", __dirname + "\\text_2_chatgpt_rev.py", "--preprompt", "You are a participant in a multi-party conversation. You are in a room with Nels and Ben. Your name is Agent. Every response should be prefixed with the speaker’s name, an arrow, the person who is spoken to and a colon (e.g., 'Nels -> Agent: …’). If you speak to everyone in the room, use 'Everyone’ as a target. You can only speak from the Agent’s perspective, so your response always starts with 'Agent ->'. Remember each person that speaks to you (these are the people in the room). Wait for someone to start speaking. Do not speak for others, only from the perspective of yourself, Agent. Respond as concisely as possible, but stay polite."]);
        // this.pythonProcess = spawn("python", ["-u", __dirname + "\\test_text_2_chatgpt.py"]);
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
            this.context.send(peer.sceneid, { type: "text generated", peer: "TODO", data: data });
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
    TextGenerationService,
};
