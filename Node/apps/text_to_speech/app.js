const { NetworkScene, UbiqTcpConnection } = require("../../ubiq");
const { RoomClient, LogCollector } = require("../../components");
const fs = require("fs");
const { TextToSpeechService } = require("../../services/text_to_speech/service");
const { TranscriptionService } = require("../../services/speech_to_text/service");
const { TextGenerationService } = require("../../services/text_generation/service");
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
const transcriptionservice = new TranscriptionService(scene, broadcastResults = false);
const texttospeechservice = new TextToSpeechService(scene, broadcastResults = true);
const textGeneration = new TextGenerationService(scene);

textGeneration.onResponse((data) => {
    var response = data.toString();
    console.log("Text Generation Response: " + response);
    if (response.startsWith(">")){
        // Slice off the leading '>' character
        response = response.slice(1);
        // If the response is not an empty string and does not contain only whitespace
        if (response.trim()){
            // This library we use does not return valid JSON. Thereforem, get the answer through regex, by finding the text between {'answer':  and , 'messageId'
            var answer = response.match(/{'answer': (.*?), 'messageId'/)[1];
            // Remove the quotes around the answer by slicing off the first and last character
            answer = answer.slice(1, -1);
            // Remove \n characters
            answer = answer.replace(/\\n/g, "");
            console.log("Received " + answer + ", sending to TTS...");
            texttospeechservice.processLocalMessage(answer);
        }
    }
});

transcriptionservice.onResponse((data, peer) => {
    console.log("Used For Text Generation...");
    // Here you can do whatever you want with the data
    var response = data.toString();
    if (response.startsWith(">")){
        response = response.slice(1); // Slice off the leading '>' character
        console.log(response);
        // texttospeechservice.processLocalMessage(response);
        if (response.trim()){
            textGeneration.processLocalMessage(response);
        }
    }
});

// transcriptionservice.onResponse((data) => {
//     console.log(data.toString());
// });

// transcriptionservice.onError((err) => {
//     console.log(err.toString());
// });

roomclient.join(roomGuid); // Join by UUID. Use an online generator to create a new one for your experiment.
