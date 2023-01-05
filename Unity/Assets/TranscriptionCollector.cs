using System.Collections;
using System.Collections.Generic;
using Ubiq.Networking;
using UnityEngine;
using Ubiq.Dictionaries;
using Ubiq.Messaging;
using Ubiq.Logging.Utf8Json;
using Ubiq.Rooms;
using System;

[NetworkComponentId(typeof(TranscriptionCollector), ComponentId)]
public class TranscriptionCollector : MonoBehaviour, INetworkComponent
{
    public const ushort ComponentId = 98;
    public NetworkId networkId = new NetworkId(98);
    private NetworkContext context;


    [Serializable]
    private struct Message
    {
        public string type;
        public string args;
    }

    // Start is called before the first frame update
    void Start()
    {
        context = NetworkScene.Register(this);
    }

    // Update is called once per frame
    void Update()
    {
        
    }

    public void ProcessMessage(ReferenceCountedSceneGraphMessage data)
    {
        Debug.Log("TranscriptionCollector.ProcessMessage");
        // var message = data.FromJson<Message>();
        // var container = JsonUtility.FromJson<Message>(message.ToString());
        // Debug.Log(JsonSerializer.Deserialize<Message>(message.ToString()));
        // var container = JsonUtility.FromJson<Message>(message.ToString());
        Debug.Log(data.ToString());
        // Debug.Log(container.args);
        // var message = new Message(message);
    }
}
