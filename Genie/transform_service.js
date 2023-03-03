/**
 * Abstract Class Service.
 *
 * @class Service
 */

const { EventEmitter } = require("stream");
const { NetworkId } = require("../Node/ubiq/messaging");
const { Transform } = require("stream");
const readline = require("readline");

const spawn = require("child_process").spawn;

class TransformService extends Transform {
    /**
     * Constructor for the Service class.
     *
     * @constructor
     * @param {NetworkScene} scene - The NetworkScene in which the service should be registered.
     * @param {int} networkId - The NetworkId that should be used for the service. This should be unique for each service and should not be one of the reserved NetworkIds.
     * @param {string} name - The name of the service.
     * @param {bool} sendResponseToPeers - Whether the response should be broadcast to all peers in the room.
     * @throws {Error} If networkId is undefined.
     */
    constructor(scene, networkId, name, config = {}) {
        super();
        this.name = name;
        this.config = config;

        // if (networkId == undefined) {
        //     throw new Error(`NetworkId must be defined for service: ${this.name}`);
        // }

        // this.objectId = new NetworkId(networkId);
        // this.componentId = networkId;

        // this.context = scene.register(this);
        this.roomClient = scene.findComponent("RoomClient"); // The RoomClient can be used to register callbacks including OnPeerJoined, OnPeerLeft, etc.

        this.childProcesses = {};
        this.childProcessReadableInterfaces = {};
    }

    /**
     * Method to register a child process. This method registers the child process with the existing OnResponse and OnError callbacks.
     *
     * @memberof Service
     * @instance
     * @param {string} identifier - The identifier for the child process. This should be unique for each child process.
     * @param {string} command - The command to execute. E.g. "python".
     * @param {Array<string>} options - The options to pass to the command.
     * @throws {Error} If identifier is undefined or if the child process fails to spawn.\
     * @returns {ChildProcess} The spawned child process.
     */
    registerChildProcess(identifier, command, options) {
        if (identifier == undefined) {
            throw new Error(`Identifier must be defined for child process of service: ${this.name}`);
        }
        if (this.childProcesses[identifier] != undefined) {
            throw new Error(`Identifier: ${identifier} already in use for child process of service: ${this.name}`);
        }

        try {
            this.childProcesses[identifier] = spawn(command, options);
        } catch (e) {
            throw new Error(`Failed to spawn child process for service: ${this.name}. Error: ${e}`);
        }

        // Register events for the child process.
        // this.childProcesses[identifier].stdout.on("data", (data) => this.emit("response", data, identifier));
        // this.childProcesses[identifier].stderr.on("data", (data) => this.emit("error", data, identifier));
        // this.childProcesses[identifier].on("close", (code, signal) => {
        //     delete this.childProcesses[identifier];
        //     this.emit("close", code, signal, identifier);
        // });

        // this.childProcesses[identifier].stdout.on("data", (data) => this.processOutput({ data, identifier }));

        console.log(`Registered child process with identifier: ${identifier} for service: ${this.name}`);

        // Check if the child process has already been closed.
        if (this.childProcesses[identifier].killed) {
            delete this.childProcesses[identifier];
            throw new Error(
                `Child process with identifier: ${identifier} for service: ${this.name} has already been closed.`
            );
        }

        this.childProcessReadableInterfaces[identifier] = readline.createInterface({
            input: this.childProcesses[identifier].stdout,
        });

        // Return reference to the child process.
        return this.childProcesses[identifier];
    }

    processOutput(data) {
        console.log(`Service: ${this.name} sending output: ${data.data}`);
        // this.push(data.data.toString());
    }

    // This will miss line events that occurred before this is called so this only really works if you know the output comes one line at a time
    // nextLine(identifier) {
    //     // Wait for the end message signal to be received from the child process to resolve the promise. The end message is END_MESSAGE.
    //     response = "";
    //     return new Promise((resolve, reject) => {
    //         function addLine(line) {
    //             if (line == "END_MESSAGE") {
    //                 this.childProcessReadableInterfaces[identifier].off("line", addLine);
    //                 resolve(response);
    //             } else {
    //                 response += line;
    //             }
    //         }
    //         this.childProcessReadableInterfaces[identifier].on("line", addLine);
    //     });
    // }

    readWaitStream(identifier) {
        return new Promise((resolve, reject) => {
            let data = "";
            this.childProcesses[identifier].once("readable", () => {
                let chunk = "";
                while ((chunk = this.childProcesses[identifier].read())) {
                    data += chunk;
                }
                console.log(`Service: ${this.name} sending output: ${data}`);
                resolve(data);
            });
        });
    }

    /**
     * Sends data to a child process with the specified identifier.
     *
     * @memberof Service
     * @param {string} data - The data to send to the child process.
     * @param {string} identifier - The identifier of the child process to send the data to.
     * @instance
     * @throws {Error} Throws an error if the child process with the specified identifier is not found.
     */
    async sendToChildProcess(identifier, data) {
        function writeToChildProcess(identifier, data) {
            return new Promise((resolve) => {
                let ready = this.childProcess[identifier].stdin.write(str, resolve);
                if (!ready) {
                    console.log("stream isn't ready yet");
                }
            });
        }

        if (this.childProcesses[identifier] == undefined) {
            throw new Error(`Child process with identifier: ${identifier} not found for service: ${this.name}`);
        }

        // Wait for the next line to be received from the child process.
        let response = await this.readWaitStream(identifier);

        // Write the data to the child process.
        await writeToChildProcess(identifier, data);

        // Wait for the response from the child process.
        return response;
    }

    _transform(chunk, encoding, callback) {
        console.log(
            `Service: ${this.name} received data with length ${chunk.data.length} and identifier ${chunk.identifier}`
        );
        callback(null, { data: this.sendToChildProcess(chunk.identifier), identifier: chunk.identifier });
    }

    /**
     * Method to kill a specific child processes.
     *
     * @memberof Service
     * @param {string} identifier - The identifier for the child process to kill.
     * @instance
     */
    killChildProcess(identifier) {
        if (this.childProcesses[identifier] == undefined) {
            throw new Error(`Child process with identifier: ${identifier} not found for service: ${this.name}`);
        }

        this.childProcesses[identifier].kill();
        delete this.childProcesses[identifier];
    }

    /**
     * Method to kill all child processes.
     *
     * @memberof Service
     * @instance
     */
    killAllChildProcesses() {
        for (const childProcess of Object.values(this.childProcesses)) {
            childProcess.kill();
        }
    }
}

module.exports = {
    TransformService,
};
