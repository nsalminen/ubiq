using System.Collections;
using System.Collections.Generic;
using Ubiq.Networking;
using UnityEngine;
using Ubiq.Dictionaries;
using Ubiq.Messaging;
using Ubiq.Logging.Utf8Json;
using Ubiq.Rooms;
using System;
using System.Text;

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
        public string peer; // TODO: implement the source peer of this text
        public string data;
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
        Message message = data.FromJson<Message>();
        Debug.Log(message.peer + " " + message.data);
    }
}
