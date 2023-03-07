/** This file contains utility functions for the Genie framework.
 * @module Genie/util
 */

const fs = require("fs");

function readConfigFile(filePath) {
    if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync("config.json"));
    } else {
        console.log(
            'No config file found. Please create a config.json file containing at least a roomGuid field. Example: {"roomGuid": "6765c52b-3ad6-4fb0-9030-2c9a05dc4731"}'
        );
        process.exit();
    }
}

// function sendResponseToPeers(data, identifier) {
//     for (const peer of this.roomClient.getPeers()) {
//         this.context.send(peer.networkId, this.componentId, {
//             type: "recognizedText",
//             peer: identifier,
//             data: data.toString(),
//         });
//     }
// }


module.exports = {
    readConfigFile,
};