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
const fs = require('fs');
const { TranscriptionService } = require("../../../ubiq/transcription");
const { TextureGenerationService } = require("../../../ubiq/texturegeneration");

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
const textureGeneration = new TextureGenerationService(scene);

transcriptionservice.start(broadcastResults = true);

transcriptionservice.onResponse((data) => {
    console.log(data.toString()); // Here you can do whatever you want with the data
    textureGeneration.execute(data.toString());
});

transcriptionservice.onError((err) => {
    console.log(err.toString());
});

textureGeneration.onResponse((data) => {
    console.log(data.toString()); // Here you can do whatever you want with the data
    
    for(const peer of this.roomClient.getPeers()){
            this.context.send(peer.networkId, this.componentId, {type: "texture generated", peer: "TODO", data: data});
        };
});

textureGeneration.onError((err) => {
    console.log(err.toString());
});
// // A list of open files to write events for particular peers into (we can close these when the peers leave the room)
// const files = {};

// function writeEventToPeerFile(peer, message){
//     if(!files.hasOwnProperty(peer)){
//         files[peer] = fs.createWriteStream(`logs/active/${peer}.log.json`,{
//             flags: "a"
//         });
//         console.log("Create file for peer " + peer);
//     }
//     files[peer].write(JSON.stringify(message) + "\n");
// }

// function closePeerFile(peer){
//     if(files.hasOwnProperty(peer)){
//         delete files[peer];
//         fs.rename(`logs/active/${peer}.log.json`, `logs/archive/${peer}.log.json`, function(err) {
//             if ( err ) console.log('ERROR: ' + err);
//         });
//     }
// }

// roomclient.addListener("OnJoinedRoom", room => {
//     console.log(room.joincode);
// });

// roomclient.addListener("OnPeerRemoved", peer =>{
//     closePeerFile(peer.uuid);
// });

// // Register for log events from the log collector.
// logcollector.addListener("OnLogMessage", (type,message) => {
//     if(type == eventType){ // Experiment
//         peer = message.peer; // All log messages include the emitting peer
//         writeEventToPeerFile(peer, message);
//     }
// });

// Calling startCollection()/lockCollection() will start streaming from the LogManagers at existing and
// and new Peers. Call this before joining a new room.
// lockCollection() is like startCollection(), but the Collector will automatically maintain its status
// as the primary collector for as long as it runs.
// logcollector.lockCollection();

roomclient.join(roomGuid); // Join by UUID. Use an online generator to create a new one for your experiment.
