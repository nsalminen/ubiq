// The LogCollectorService sample creates a programmatic peer that joins a room
// and records all Experiment Log Events (0x2) it encounters.
//
// To achieve this, we first create a NetworkScene (the Peer), and create a
// connection for it to the server (which is specified here as Nexus). Then we
// add a RoomClient and LogCollector component(s). These join a room and recieve
// log messages.
//
// The LogCollector uses the Id of the peers to decide where to write the events.
// It creates new files on demand, and closes them when the corresponding Peer
// has left the room.

// Import Ubiq types
const { NetworkScene, RoomClient, LogCollector, UbiqTcpConnection } = require("../../../ubiq");
const fs = require("fs");
const { TranscriptionService } = require("../../services/speech_to_text/service");

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
// const logcollector = new LogCollector(scene);
const transcriptionservice = new TranscriptionService(scene);

transcriptionservice.start((broadcastResults = true));

transcriptionservice.onResponse((data) => {
    console.log(data.toString());
});

transcriptionservice.onError((err) => {
    console.log(err.toString());
});

roomclient.join(roomGuid); // Join by UUID. Use an online generator to create a new one for your experiment.
