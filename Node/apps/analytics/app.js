const { NetworkScene, UbiqTcpConnection } = require("../../ubiq");
const { RoomClient, LogCollector } = require("../../components");
const fs = require("fs");
const { TranscriptionService } = require("../../services/speech_to_text/service");
const nconf = require('nconf');

// Load ubiq config
nconf.file('local', '../../config/local.json');
nconf.file('default', '../../config/default.json');

// Configuration
eventType = 2;
roomGuid = "6765c52b-3ad6-4fb0-9030-2c9a05dc4731";

// Create a connection to a Server
const connection = UbiqTcpConnection("localhost", nconf.get('roomserver:tcp'));

// A NetworkScene
const scene = new NetworkScene();
scene.addConnection(connection);

// A RoomClient to join a Room
const roomclient = new RoomClient(scene);
const logcollector = new LogCollector(scene);
// const transcriptionservice = new TranscriptionService(scene);

// transcriptionservice.start(broadcastResults = true);

// transcriptionservice.onResponse((data) => {
//     console.log(data.toString());
// });

// transcriptionservice.onError((err) => {
// console.log(err.toString());
// });

// A list of open files to write events for particular peers into (we can close these when the peers leave the room)
const files = {};

function writeEventToPeerFile(peer, message) {
    if (!files.hasOwnProperty(peer)) {
        files[peer] = fs.createWriteStream(`logs/active/${peer}.log.json`, {
            flags: "a",
        });
        console.log("Create file for peer " + peer);
    }
    files[peer].write(JSON.stringify(message) + "\n");
}

function closePeerFile(peer) {
    if (files.hasOwnProperty(peer)) {
        delete files[peer];
        fs.rename(`logs/active/${peer}.log.json`, `logs/archive/${peer}.log.json`, function (err) {
            if (err) console.log("ERROR: " + err);
        });
    }
}

roomclient.addListener("OnJoinedRoom", (room) => {
    console.log(room.joincode);
});

roomclient.addListener("OnPeerRemoved", (peer) => {
    closePeerFile(peer.uuid);
});

// Register for log events from the log collector.
logcollector.addListener("OnLogMessage", (type, message) => {
    if (type == eventType) {
        // Experiment
        peer = message.peer; // All log messages include the emitting peer
        writeEventToPeerFile(peer, message);
    }
});

// Calling startCollection()/lockCollection() will start streaming from the LogManagers at existing and
// and new Peers. Call this before joining a new room.
// lockCollection() is like startCollection(), but the Collector will automatically maintain its status
// as the primary collector for as long as it runs.
logcollector.lockCollection();

roomclient.join(roomGuid); // Join by UUID. Use an online generator to create a new one for your experiment.
