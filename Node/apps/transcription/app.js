const { NetworkScene, RoomClient, LogCollector, UbiqTcpConnection } = require("../../ubiq");
const { SpeechToTextService } = require("../../services/speech_to_text/service");
const { readConfigFile } = require("../../../Genie/utils");
const { MessageReader } = require("../../../Genie/message_reader");
const { Writable, Transform, pipeline } = require("stream");

// Load configuration from config.json with utility function
const config = readConfigFile("config.json");

// Create a connection to a Server
const connection = UbiqTcpConnection("localhost", 8005);

// A NetworkScene
const scene = new NetworkScene();
scene.addConnection(connection);

// A RoomClient to join a Room
const roomClient = new RoomClient(scene);

// A MessageReader to read audio data from peers that is received as a network message.
const audioReader = new MessageReader(scene, 98);

// A TranscriptionService to transcribe audio coming from peers
const transcriptionService = new SpeechToTextService(
    scene,
    (broadcastOutput = true),
    (writeOutputToFile = false),
    config
);

// A Writable stream to write transcription results to the console
const consoleWriter = new Writable({
    write(chunk, encoding, callback) {
        console.log("Writing to console: ");
        console.log("Length: " + chunk.data.toString());
        callback(null, null);
    },
    objectMode: true
});

async function run() {
    await pipeline(
        audioReader,
        new Transform({
            objectMode: true,
            transform(chunk, encoding, callback) {
                const peer_uuid = chunk.slice(0, 36).toString();
                const audio_data = chunk.slice(36);
                // console.log("Received audio data from peer " + peer_uuid + ": " + audio_data.length + " bytes")
                callback(null, { "identifier": peer_uuid, "data": audio_data });
            },
        }),
        transcriptionService,
        consoleWriter,
        (err) => {
            if (err) {
                console.error("Pipeline failed.", err);
            } else {
                console.log("Pipeline succeeded.");
            }
        }
    );
}

// // Register a callback for when a child process closes
// transcriptionService.on("close", (code, signal, identifier) => {
//     console.log("Child process " + identifier + " closed with code " + code + " and signal " + signal);
// });

// // Register a callback for when a child process sends data
// transcriptionService.on("response", (data, identifier) => {
//     console.log("Response from " + identifier + ": " + data.toString());
// });

// Join by UUID. Use an online generator to create a new one for your application.
roomClient.join(config.roomGuid);

run().catch(console.error);