const { NetworkScene, RoomClient, LogCollector, UbiqTcpConnection } = require("../../ubiq");
const fs = require("fs");
const { TranscriptionService } = require("../../services/speech_to_text/service");
const { TextureGenerationService } = require("../../services/image_generation/service");
const { FileServer } = require("../../services/file_server/service");
const commandRegex =
    /(?:transform|create|make|set|change|turn)(?: the| an| some)? (?:(?:(.*?) (?:(?:to|into|look like|appear like|seem like|)) (.*)))/i;
var textureTarget = null;

const file_server = new FileServer((directory = "data"));
file_server.start();

// Configuration
eventType = 2;
roomGuid = "6765c52b-3ad6-4fb0-9030-2c9a05dc4731";

// Create a connection to a Server
const connection = UbiqTcpConnection("localhost", 8005);

// A NetworkScene
const scene = new NetworkScene();
scene.addConnection(connection);

// A RoomClient to join a Room
const roomclient = new RoomClient(scene);
const transcriptionservice = new TranscriptionService(scene);
const textureGeneration = new TextureGenerationService(scene);

transcriptionservice.start((broadcastResults = true));

transcriptionservice.onResponse((data) => {
    console.log("Used For Texture Generation...");
    if (data.startsWith("RECOGNIZED: ")) {
        let resultMatch = transcriptionservice.resultRegex.exec(data);
        console.log(resultMatch);
        if (resultMatch[1]) {
            let commandMatch = commandRegex.exec(resultMatch[1]);
            if (commandMatch != null) {
                if (commandMatch[1] && commandMatch[2]) {
                    console.log(commandMatch[1], commandMatch[2]);
                    textureTarget = commandMatch[1];
                    textureGeneration.execute(commandMatch[2]);
                }
            }
        }
    }
});

transcriptionservice.onError((err) => {
    console.log(err.toString());
});

textureGeneration.onResponse((data) => {
    console.log(data.toString()); // Here you can do whatever you want with the data
    if (data.includes(".png")) {
        for (const peer of textureGeneration.roomClient.getPeers()) {
            textureGeneration.context.send(peer.networkId, textureGeneration.componentId, {
                type: "TextureGeneration",
                target: textureTarget,
                data: data,
            });
        }
    }
});

textureGeneration.onError((err) => {
    console.log(err.toString());
});

roomclient.join(roomGuid); // Join by UUID. Use an online generator to create a new one for your experiment.
