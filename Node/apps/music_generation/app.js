const { NetworkScene, UbiqTcpConnection } = require("../../ubiq");
const { RoomClient, LogCollector } = require("../../components");
const fs = require("fs");
const { TranscriptionService } = require("../../services/speech_to_text/service");
const { MusicGenerationService } = require("../../services/music_generation/service");
const { FileServer } = require("../../services/file_server/service");
const nconf = require('nconf');

const commandRegex =
    /(?:transform|create|make|set|change|turn)(?: the| an| some)? (?:(?:(.*?)?(?:(?: to| into| seem| look| appear|))?(?: like|like a|like an| a)? (.*)))/i;
var musicTarget = null;

const file_server = new FileServer((directory = "data"));
file_server.start();

// Configuration
eventType = 1;
roomGuid = "6765c52b-3ad6-4fb0-9030-2c9a05dc4731";

// Load ubiq config
nconf.file('local', '../../config/local.json');
nconf.file('default', '../../config/default.json');

// Create a connection to a Server
const connection = UbiqTcpConnection("localhost", nconf.get('roomserver:tcp'));

// A NetworkScene
const scene = new NetworkScene();
scene.addConnection(connection);

// A RoomClient to join a Room
const roomClient = new RoomClient(scene);
const transcriptionService = new TranscriptionService(scene);
const musicGeneration = new MusicGenerationService(scene);
const selectionCollector = new LogCollector(scene);

lastPeerSelection = {};
selectionCollector.addListener("OnLogMessage", (type, message) => {
    if (type == eventType) {
        var peer = message.peer;
        var objectMaterial = message.event;
        const time = new Date().getTime();

        // console.log("Received message from peer: " + peer_uuid + " at time: " + time + " with message: " + objectMaterial);

        lastPeerSelection[peer] = {
            time: time,
            message: objectMaterial,
        };

        console.log(peer + " " + message.event);
    }
});

transcriptionService.onResponse((data, peer) => {
    response = data.toString();
    var peer_uuid = peer.uuid; // We now return the full peer object, so we need to extract the UUID
    console.log("Received response from peer: " + peer_uuid + " with message: " + response);
    if (response.startsWith(">")) {
        response = response.slice(1); // Slice off the leading '>' character
        let commandMatch = commandRegex.exec(response);
        if (commandMatch != null) {
            if (commandMatch[1] && commandMatch[2]) {
                console.log("Command recognized");
                console.log(commandMatch[1], commandMatch[2]);
                musicTarget = commandMatch[1];

                // Check if audio source target is "this" or "that" or "all of these" or "all of those"
                if (musicTarget.toLowerCase() == "this" || musicTarget.toLowerCase() == "that") {
                    // If so, we need to retrieve the last selected object by the peer in lastPeerSelection, if it was within the last 10 seconds
                    const time = new Date().getTime();
                    if (lastPeerSelection[peer_uuid] && time - lastPeerSelection[peer_uuid].time < 10000) {
                        musicTarget = lastPeerSelection[peer_uuid].message;
                        console.log("Changing ray-based audio target to: " + musicTarget);
                    } else {
                        console.log("No object selected by peer " + peer_uuid + " in the last 10 seconds, so cannot change audio target");
                    }
                }

                for (const peer of musicGeneration.roomClient.getPeers()) {
                    musicGeneration.context.send(peer.networkId, musicGeneration.componentId, {
                        type: "GenerationStarted",
                        target: musicTarget,
                        data: "",
                        peer: peer,
                    });
                }
                musicGeneration.processLocalMessage(commandMatch[2]);
            } else {
                console.log("shit");
            }
        }
    }
});

transcriptionService.onError((err) => {
    console.log(err.toString());
});

musicGeneration.onResponse((data) => {
    console.log(data.toString()); // Here you can do whatever you want with the data
    if (data.includes(".mp3")) {
        for (const peer of musicGeneration.roomClient.getPeers()) {
            musicGeneration.context.send(peer.networkId, musicGeneration.componentId, {
                type: "MusicGeneration",
                target: musicTarget,
                data: data,
                peer: "", // TODO: add peer uuid later (not essential for now)
            });
        }
    }
});

musicGeneration.onError((err) => {
    console.log(err.toString());
});

selectionCollector.lockCollection();
roomClient.join(roomGuid); // Join by UUID. Use an online generator to create a new one for your experiment.
