const { write, appendFileSync } = require('fs');
const { nextTick } = require('process');
const { Stream, EventEmitter, Writable } = require('stream');
const { NetworkId, Message } = require("./messaging");
const wav = require('wav');
const { throws } = require('assert');
const spawn = require("child_process").spawn;
const { LogCollectorMessage } = require("./logcollector");




// The LogCollector can be attached to a NetworkScene with a RoomClient to receive logs
// from the LogMangers in a Room.
// Call startCollection() to begin receiving. There must only be one LogCollector in
// the Room.
// The log events are output via the userEventStream and applicationEventStream Readables. 
// Register for the "data" event, or pipe these to other streams to receive log events.
// Until this is done, or resume() is called, the streams will be paused. In paused mode
// the streams will discard any events, so make sure to connect the streams to the sink
// before calling startCollection().
class TextureGenerationService extends EventEmitter{
    constructor(scene){
        super();
        this.objectId = new NetworkId(97);
        this.componentId = 97;
        this.audioData = Buffer.alloc(0);

        this.context = scene.register(this);
        this.registerRoomClientEvents();
        this.pythonProcess = null;
        this.resultRegex = /text="([^"]*)"/;
    }

    start(broadcastResults = false) {
        this.pythonProcess = spawn('python',["-u", "../texture_generation/text_2_image.py"]);
        this.pythonProcess.stdout.on('data', (data) => {
            if (broadcastResults){
                var response = data.toString();
                if (response.split('.').pop() == "png"){
                    this.sendResponse(response);
                }
            }
        });
    }

    sendResponse(data) {
        for(const peer of this.roomClient.getPeers()){
            this.context.send(peer.networkId, this.componentId, {type: "texture generated", peer: "TODO", data: data});
        };
    }

    registerRoomClientEvents(){
        this.roomClient = this.context.scene.findComponent("RoomClient");
        if(this.roomClient == undefined){
            throw "RoomClient must be added to the scene before AudioCollector";
        }
        this.roomClient.addListener("OnPeerAdded", function(){
            console.log("AudioCollector OnPeerAdded");
        }.bind(this));

        this.roomClient.addListener("OnPeerRemoved", function(){
            writer.end();
            console.log("AudioCollector OnPeerRemoved");
        }.bind(this));
    }
    
    execute(msg){ //maybe local process message
        if (this.pythonProcess) {
            this.pythonProcess.stdin.write(msg + '\n');
            }
    }

    processMessage(msg){

    }

    onResponse(cb) {
        if (this.pythonProcess) {
            this.pythonProcess.stdout.on('data', (data) => cb(data.toString()));
        }
    }
    
    onError(cb) {
        if (this.pythonProcess) {
            this.pythonProcess.stderr.on('data', (data) => cb(data));
        }
    }
}

module.exports = {
     TextureGenerationService
};