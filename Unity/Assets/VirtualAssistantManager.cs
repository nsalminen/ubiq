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
using Ubiq.Voip;
using Ubiq.Samples;

[NetworkComponentId(typeof(VirtualAssistantManager), ComponentId)]
public class VirtualAssistantManager : MonoBehaviour, INetworkComponent
{
    public const ushort ComponentId = 95;
    public NetworkId networkId = new NetworkId(95);
    private NetworkContext context;

    public VoipAudioSourceOutput voipAudioSourceOutput;
    public SpeechIndicator speechIndicator;
    public HandMover handMover;

    [Serializable]
    private struct Message
    {
        public string type;
        public string targetPeer;
        public string audioLength;
    }

    // Start is called before the first frame update
    void Start()
    {
        context = NetworkScene.Register(this);
    }

    // Update is called once per frame
    void Update()
    {
        if (speechIndicator)
        {
            speechIndicator.InjectStatsSource(voipAudioSourceOutput);
            if (handMover)
            {
                if (speechIndicator.EstimateCurrentVolume() > speechIndicator.minVolume)
                {
                    handMover.Play();
                }
            }
        }
    }

    public void ProcessMessage(ReferenceCountedSceneGraphMessage data)
    {
        Debug.Assert(voipAudioSourceOutput);

        // If the data is less than 100 bytes, then we have have received the audio info header
        if (data.data.Length < 100)
        {
            // Try to parse the data as a message, if it fails, then we have received the audio data
            Message message;
            try
            {
                message = data.FromJson<Message>();
                Debug.Log("Received audio for peer: " + message.targetPeer + " with length: " + message.audioLength);
                return;
            }
            catch (Exception e)
            {
                Debug.Log("Received audio data");
            }
        }

        if (data.data.Length < 200)
        {
            return;
        }

        Debug.Log("injecting audio");
        voipAudioSourceOutput.InjectAudioPcm(data.data.ToArray());
    }
}
