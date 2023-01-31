const { NetworkScene, RoomClient, LogCollector, UbiqTcpConnection } = require("../../ubiq");
const fs = require("fs");
const { TextToSpeechService } = require("../../services/text_to_speech/service");
const { TargetedTextToSpeechService } = require("../../services/custom_services/targeted_text_to_speech/service");
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
const texttospeechservice = new TargetedTextToSpeechService(scene, broadcastResults = true);
const textGeneration = new TextGenerationService(scene);
var targetPeer = null;

textGeneration.onResponse((data) => {
    var response = data.toString();
    console.log("Text Generation Response: " + response);
    if (response.startsWith(">")){
        // Slice off the leading '>' character
        response = response.slice(1);
        // If the response is not an empty string and does not contain only whitespace
        if (response.trim()){
            // The unofficial library we currently use does not return valid JSON. Thereforem, get the answer through regex, by finding the text between {'answer':  and , 'messageId'
            var answer = response.match(/{'answer': (.*?), 'messageId'/)[1];
            console.log("Answer: " + answer);
            answer = answer.slice(1, -1).replace(/\\n/g, ""); // Remove the quotes around the answer by slicing off the first and last character. Also, remove the newline characters.
            console.log("Received " + answer + ", sending to TTS... for peer " + targetPeer.uuid);
            answer = answer.replace(/.*->.*: /, ""); // Trim the part of the answer the contains "Agent -> Person: " from the beginning of the answer.
            texttospeechservice.processLocalMessage(answer, targetPeer);
        }
    }
});

transcriptionservice.onResponse((data, peer) => {
    targetPeer = peer;
    if (peer.properties && peer.properties["ubiq.samples.social.name"]) {
        var peerName = peer.properties["ubiq.samples.social.name"];
    } else {
        var peerName = peer.uuid;
    }
    var response = data.toString();
    if (response.startsWith(">")){
        response = response.slice(1); // Slice off the leading '>' character
        if (response.trim()){
            console.log(peerName + "-> Agent: " + response);
            textGeneration.processLocalMessage(peerName + "-> Agent: " + response);
        }
    }
});

roomclient.join(roomGuid); // Join by UUID. Use an online generator to create a new one for your experiment.
