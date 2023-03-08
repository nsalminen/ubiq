const { NetworkScene, UbiqTcpConnection, NetworkId } = require("../../ubiq");
const { RoomClient } = require("../../components/roomclient");
const { SpeechToTextService } = require("../../services/speech_to_text/service");
const { ImageGenerationService } = require("../../services/image_generation/service");
const { readConfigFile } = require("../../../Genie/utils");
const { MessageReader } = require("../../../Genie/message_reader");
const { FileServer } = require("../../services/file_server/service");
const fs = require("fs");
const { LogCollector } = require("../../components/logcollector");
const nconf = require("nconf");

/**
 * Load configuration and create a connection to a server
 **/

// Load Ubiq config
nconf.file("local", "../../config/local.json");
nconf.file("default", "../../config/default.json");

// Load configuration from config.json with utility function
const config = readConfigFile("config.json");

// Create a connection to a Server
const connection = UbiqTcpConnection("localhost", nconf.get("roomserver:tcp"));

// A NetworkScene
const scene = new NetworkScene();
scene.addConnection(connection);

// A RoomClient to join a Room
const roomClient = new RoomClient(scene);

/**
 * Define services: FileServer, MessageReader (audio), MessageReader (selection), 
 * SpeechToTextService, ImageGenerationService
 **/

// A FileServer to serve image files to clients
const fileServer = new FileServer((directory = "data"));

// A MessageReader to read audio data from peers based on fixed network ID
const audioReceiver = new MessageReader(scene, 98);

// A SpeechToTextService to transcribe audio coming from peers
const transcriptionService = new SpeechToTextService(scene, config);

// An ImageGenerationService to generate images based on text
const textureGeneration = new ImageGenerationService(scene);

// A MessageReader to receive selection data from peers based on fixed network ID
// Selection data is stored in a dictionary, where the key is the peer UUID and the value is target object
const selectionReceiver = new MessageReader(scene, 93);
var lastPeerSelection = {};

const commandRegex =
    /(?:transform|create|make|set|change|turn)(?: the| an| some)? (?:(?:(.*?)?(?:(?: to| into| seem| look| appear|))?(?: like|like a|like an| a)? (.*)))/i;
var textureTarget = {};

/**
 * Define application pipeline: audioReceiver -> transcriptionService -> imageGeneration (selectionReceiver) -> fileServer
 * TODO: We currently use EventEmitter to connect services, but we will replace this with a more robust solution 
 * in the future (e.g. with streams.pipeline)
 **/

// Step 1: When we receive a selection from a peer, store it in a dictionary for later use
selectionReceiver.on("data", (data) => {
    // Split the data into a peer_uuid (36 bytes) and the string containg the selection (rest)
    const peerUUID = data.message.subarray(0, 36).toString();
    const objectMaterial = data.message.subarray(36, data.message.length).toString();

    lastPeerSelection[peerUUID] = {
        time: new Date().getTime(),
        message: objectMaterial,
    };
});

// Step 2: When we receive audio data from a peer, split it into a peer UUID and audio data, and send it to the transcription service
audioReceiver.on("data", (data) => {
    // Split the data into a peer_uuid (36 bytes) and audio data (rest)
    const peerUUID = data.message.subarray(0, 36).toString();
    const audio_data = data.message.subarray(36, data.message.length);

    // Send the audio data to the transcription service
    transcriptionService.sendToChildProcess(peerUUID, JSON.stringify(audio_data.toJSON()) + "\n");
});

// Step 3: When we receive a transcription from the transcription service, send it to the image generation service
transcriptionService.on("response", (data, identifier) => {
    response = data.toString();
    var peerUUID = identifier;
    console.log("Received response from peer: " + peerUUID + " with message: " + response);
    if (response.startsWith(">")) {
        response = response.slice(1); // Slice off the leading '>' character
        let commandMatch = commandRegex.exec(response);
        if (commandMatch != null) {
            if (commandMatch[1] && commandMatch[2]) {
                console.log("Command recognized");
                console.log(commandMatch[1], commandMatch[2]);
                textureTarget = commandMatch[1];

                // Check if texture target is "this" or "that" or "all of these" or "all of those"
                if (textureTarget.toLowerCase() == "this" || textureTarget.toLowerCase() == "that") {
                    // If so, we need to retrieve the last selected object by the peer in lastPeerSelection, if it was within the last 10 seconds
                    const time = new Date().getTime();
                    if (lastPeerSelection[peerUUID] && time - lastPeerSelection[peerUUID].time < 10000) {
                        textureTarget = lastPeerSelection[peerUUID].message;
                        console.log("Changing ray-based texture target to: " + textureTarget);
                    } else {
                        console.log(
                            "No object selected by peer " +
                                peerUUID +
                                " in the last 10 seconds, so cannot change texture target"
                        );
                    }
                }

                scene.send(new NetworkId(97), {
                    type: "GenerationStarted",
                    target: textureTarget,
                    data: "",
                    peer: peerUUID,
                });

                // If command contains the word texture or pattern, add a suffix to the command to make it more specific
                if (
                    commandMatch[2].toLowerCase().includes("texture") ||
                    commandMatch[2].toLowerCase().includes("pattern")
                ) {
                    commandMatch[2] += ", seamless, flat texture, video game texture";
                }
                // Create target file name based on peer uuid, target object, and current time
                const time = new Date().getTime();
                const targetFileName = peerUUID + "_" + textureTarget + "_" + time;
                console.log(
                    "Sending command to texture generation service: " +
                        commandMatch[2] +
                        " with target file name: " +
                        targetFileName
                );

                textureGeneration.sendToChildProcess(
                    "default",
                    JSON.stringify({
                        prompt: commandMatch[2],
                        output_file: targetFileName,
                    }) + "\n"
                );
            }
        }
    }
});

// Step 4: When we receive a response from the image generation service, send a message to clients with the image file name.
textureGeneration.on("response", (data, identifier) => {
    data = data.toString();
    if (data.includes(".png")) {
        const [peerUUID, target, time] = data.split("_");
        scene.send(config.outputNetworkId, {
            type: "TextureGeneration",
            target: target,
            data: data,
            peer: peerUUID,
        });
    }
});

textureGeneration.on("error", (err) => {
    console.log(err.toString());
});

roomClient.join(config.roomGuid); // Join by UUID. Use an online generator to create a new one for your experiment.
