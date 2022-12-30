const { write, appendFileSync } = require('fs');
const { nextTick } = require('process');
const { Stream, EventEmitter, Writable } = require('stream');
const { NetworkId, Message } = require("./messaging");
const wav = require('wav');
const spawn = require("child_process").spawn;


const pythonProcess = spawn('python',["-u", "transcribe.py"]);
pythonProcess.stdout.on('data', (data) => {
  console.log("PYTHON SENT:", data.toString());
});

pythonProcess.on('exit', function (code) { 
    console.log("Python child process exited with code " + code);
});

pythonProcess.on('error', function(err) {
    console.log(err);
});

// Spawn a child Python process
// const pythonProcess = spawn('python', ['./transcribe.py']);

// Listen for data events on the child process's stdout
// pythonProcess.stdout.on('data', (data) => {
//   console.log(`Received data from Python: ${data}`);
// });

// Send data to the child Python process's stdin
// pythonProcess.stdin.write('some data\n');
const writer = new wav.FileWriter('audio.wav', {
    channels: 1,            // Number of channels (1 for mono, 2 for stereo)
    sampleRate: 16000,      // Sample rate in Hz
    bitDepth: 16            // Bit depth (16 for G722)
});

// The LogCollector can be attached to a NetworkScene with a RoomClient to receive logs
// from the LogMangers in a Room.
// Call startCollection() to begin receiving. There must only be one LogCollector in
// the Room.
// The log events are output via the userEventStream and applicationEventStream Readables. 
// Register for the "data" event, or pipe these to other streams to receive log events.
// Until this is done, or resume() is called, the streams will be paused. In paused mode
// the streams will discard any events, so make sure to connect the streams to the sink
// before calling startCollection().
class AudioCollector extends EventEmitter{
    constructor(scene){
        super();
        this.objectId = new NetworkId(98);
        this.componentId = 98;
        this.audioData = Buffer.alloc(0);

        this.context = scene.register(this);
        this.registerRoomClientEvents();
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

    processMessage(msg){
        // console.log(msg.message.length);
        this.audioData = Buffer.concat([this.audioData, msg.message]);
        
        while (this.audioData.length >= 256) {
            // Slice the first 256 bytes from the audioData buffer
            const chunk = this.audioData.slice(0, 256);
      
            // Write the chunk to the local audio file
            appendFileSync('audio.g722', chunk);

            // Write the chunk to the WAV file
            writer.write(chunk);
      
            // Remove the chunk from the audioData buffer
            this.audioData = this.audioData.slice(256);
            // console.log(JSON.stringify(chunk.toJSON()))
            // JSON.stringify(bufferOne);
            // Send data to the child Python process's stdin
            pythonProcess.stdin.write(JSON.stringify(chunk.toJSON()) + '\n');
        }
    }
}

module.exports = {
    AudioCollector
};