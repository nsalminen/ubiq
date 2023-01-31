using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Ubiq.Voip;
using Ubiq.Messaging;

public class ObserveTheSpeaker : MonoBehaviour
{
    public float speed = 5.0f; // Speed at which head turns towards sound
    private Vector3 soundDirection; // Direction of the sound

    public int sampleWindow = 64;
    private VoipPeerConnectionManager peerConnectionManager;
    private AudioClip microphoneClip;

    string microphoneName;
    public GameObject localSpeaker;

    // Start is called before the first frame update
    void Start()
    {
        peerConnectionManager = NetworkScene.FindNetworkScene(this).
    GetComponentInChildren<VoipPeerConnectionManager>();
        microphoneName = Microphone.devices[0];

    }

    public AudioClip MicrophoneToAudioClip()
    {

        VoipMicrophoneInput ml = peerConnectionManager.GetAudioSource() as VoipMicrophoneInput;
        return ml.GetAudioClip();
    }

    public float  GetLoudnessFromAudioClip(int clipPosition, AudioClip clip)
    {
        int startPosition = clipPosition - sampleWindow;

        if (startPosition < 0) return 0.0f;

        float[] waveData = new float[sampleWindow];
        clip.GetData(waveData, startPosition);

        float totalLoudness = 0;
        for (int i=0; i<sampleWindow; i++)
        {
            totalLoudness += Mathf.Abs(waveData[i]);
        }
        return totalLoudness / sampleWindow;
    }

    // Update is called once per frame
    void Update()
    {
        var voipOutput = GetComponentInChildren<VoipAudioSourceOutput>();
        microphoneClip = MicrophoneToAudioClip();
        if (microphoneClip)
        {
            float loudness = GetLoudnessFromAudioClip(Microphone.GetPosition(microphoneName), microphoneClip);
            loudness = Mathf.Max(loudness,voipOutput.lastFrameStats.volume);

            //Debug.Log(loudness);
            if(loudness > 0.01f )
            {
                // Get the direction of the sound
                soundDirection = localSpeaker.transform.position - transform.position;
                soundDirection = new Vector3(soundDirection.x, 0, soundDirection.z);

                // Rotate the head towards the sound
                transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(soundDirection), speed * Time.deltaTime);
            }

        }

    }
}
