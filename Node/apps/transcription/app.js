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
// const logcollector = new LogCollector(scene);
const transcriptionservice = new TranscriptionService(scene, broadcastResults = true);

transcriptionservice.onResponse((data) => {
    console.log(data.toString());
});

transcriptionservice.onError((err) => {
    console.log(err.toString());
});

roomclient.join(roomGuid); // Join by UUID. Use an online generator to create a new one for your experiment.
