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
using Ubiq.Samples;
using Ubiq.Voip;
using Ubiq.Voip.Implementations;
using Ubiq.Voip.Implementations.Dotnet;

public class VirtualAssistantManager : MonoBehaviour
{
    private class AssistantSpeechUnit
    {
        public int samples;
        public string speechTargetName;
    }

    public NetworkId networkId = new NetworkId(95);
    private NetworkContext context;

    public InjectableAudioSourceDotnetVoipSink voipAudioSourceOutput;
    public InjectableSpeechIndicator speechIndicator;
    public VirtualAssistantController assistantController;

    private string speechTargetName;

    private List<AssistantSpeechUnit> speechUnits = new List<AssistantSpeechUnit>();

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
        context = NetworkScene.Register(this,networkId);
    }

    // Update is called once per frame
    void Update()
    {
        if (voipAudioSourceOutput && speechUnits.Count > 0)
        {
            speechUnits[0].samples -= 0;//todo voipAudioSourceOutput.lastFrameStats.samples;
            if (speechUnits[0].samples <= 0)
            {
                speechUnits.RemoveAt(0);
            }
        }

        if (speechIndicator)
        {
            speechIndicator.InjectStatsSource(voipAudioSourceOutput);
            var volume = speechIndicator.EstimateCurrentVolume();
            if (assistantController)
            {
                var speechTarget = null as string;
                if (speechUnits.Count > 0)
                {
                    speechTarget = speechUnits[0].speechTargetName;
                }

                assistantController.SetAssistantSpeechVolumeRange(speechIndicator.minVolume,speechIndicator.maxVolume);
                assistantController.UpdateAssistantSpeechStatus(speechTarget,volume);
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
                speechTargetName = message.targetPeer;
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

        var speechUnit = new AssistantSpeechUnit();
        speechUnit.samples = data.data.Length/2;
        speechUnit.speechTargetName = speechTargetName;
        speechUnits.Add(speechUnit);

        voipAudioSourceOutput.InjectAudioPcm(data.data.ToArray());
    }
}
