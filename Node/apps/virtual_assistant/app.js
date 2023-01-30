const { NetworkScene, RoomClient, LogCollector, UbiqTcpConnection } = require("../../ubiq");
const fs = require("fs");
const { TextToSpeechService } = require("../../services/text_to_speech/service");
const { TranscriptionService } = require("../../services/speech_to_text/service");
const { TextGenerationService } = require("../../services/text_generation/service");

// Configuration
eventType = 2;
roomGuid = "6765c52b-3ad6-4fb0-9030-2c9a05dc4731";
postfix = ". Respond in one short sentence."

// Create a connection to a Server
const connection = UbiqTcpConnection("localhost", 8005);

// A NetworkScene
const scene = new NetworkScene();
scene.addConnection(connection);

// A RoomClient to join a Room
const roomclient = new RoomClient(scene);
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
            answer = answer.slice(1, -1).replace(/\\n/g, "").replace(/\\'/,"'");

            console.log("Received " + answer + ", sending to TTS...");
            texttospeechservice.execute(answer);
        }
    }
});

transcriptionservice.onResponse((data, peer) => {
    var response = data.toString();
    if (response.startsWith(">")){
        response = response.slice(1); // Slice off the leading '>' character
        if (response.trim()){
            response = response.trim() + postfix;
            console.log("Text Generation Request: " + response);
            textGeneration.execute(response);
        }
    }
});

roomclient.join(roomGuid); // Join by UUID. Use an online generator to create a new one for your experiment.
