const { NetworkScene, RoomClient, LogCollector, UbiqTcpConnection } = require("../../ubiq");
const { SpeechToTextService } = require("../../services/speech_to_text/service");
const { readConfigFile } = require("../../../Genie/utils");

// Load configuration from config.json with utility function
const config = readConfigFile("config.json");

// Create a connection to a Server
const connection = UbiqTcpConnection("localhost", 8005);

// A NetworkScene
const scene = new NetworkScene();
scene.addConnection(connection);

// A RoomClient to join a Room
const roomClient = new RoomClient(scene);
// A TranscriptionService to transcribe audio coming from peers
const transcriptionService = new SpeechToTextService(
    scene,
    (broadcastOutput = true),
    (writeOutputToFile = false),
    config
);

// Register a callback for when a child process closes
transcriptionService.on("close", (code, signal, identifier) => {
    console.log("Child process " + identifier + " closed with code " + code + " and signal " + signal);
});

// Register a callback for when a child process sends data
transcriptionService.on("response", (data, identifier) => {
    console.log("Response from " + identifier + ": " + data.toString());
});

// Join by UUID. Use an online generator to create a new one for your application.
roomClient.join(config.roomGuid);
