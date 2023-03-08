const { NetworkScene, UbiqTcpConnection, NetworkId } = require("../../ubiq");
const { RoomClient } = require("../../components/roomclient");
const { SpeechToTextService } = require("../../services/speech_to_text/service");
const { readConfigFile } = require("../../../Genie/utils");
const { MessageReader } = require("../../../Genie/message_reader");
const fs = require("fs");
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
 * Define services: MessageReader, TranscriptionService, and a file writer
 **/

// A MessageReader to read audio data from peers based on fixed network ID
const audioReceiver = new MessageReader(scene, 98);

// A SpeechToTextService to transcribe audio coming from peers
const transcriptionService = new SpeechToTextService(scene, config);

// Define file writer to write transcription output to a file
const writer = fs.createWriteStream("transcription.txt");

/**
 * Define application pipeline: audioReceiver -> transcriptionService -> writer
 * TODO: We currently use EventEmitter to connect services, but we will replace this with a more robust solution
 * in the future (e.g. with streams.pipeline)
 **/

// Step 1: When we receive audio data from a peer, split it into a peer UUID and audio data, and send it to the transcription service
audioReceiver.on("data", (data) => {
    // Split the data into a peer_uuid (36 bytes) and audio data (rest)
    const peerUUID = data.message.subarray(0, 36).toString();
    const audioData = data.message.subarray(36, data.message.length);

    // Send the audio data to the transcription service
    transcriptionService.sendToChildProcess(peerUUID, JSON.stringify(audioData.toJSON()) + "\n");
});

// Step 2: When we receive a response from the transcription service, write it to a file. Also, send it to the client.
transcriptionService.on("response", (data, identifier) => {
    // If data starts with "> ", it is a transcription result. Otherwise, it is a status message.
    if (data.toString().startsWith(">")) {
        writer.write(identifier + ": " + data.toString().substring(1));

        // Send the transcription result to the client based on a predefined networkId
        scene.send(new NetworkId(config.outputNetworkId), {
            type: "Transcription",
            peer: identifier,
            data: data.toString(),
        });
    } else {
        console.log("Child process " + identifier + " sent status message: " + data.toString());
    }
});

// Join room by UUID. Use an online generator to create a new one for your application.
roomClient.join(config.roomGuid);
