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

[NetworkComponentId(typeof(AudioCollector), ComponentId)]
public class AudioCollector : MonoBehaviour, INetworkComponent
{
    public const ushort ComponentId = 95;
    public NetworkId networkId = new NetworkId(95);
    private NetworkContext context;
    public AudioSource audioSource;

    // List of audio clips to play
    private List<AudioClip> audioClips = new List<AudioClip>();
    private float[] allAudioData;
    private int position;

    void OnAudioRead(float[] data)
    {
        Debug.Log("OnAudioRead: " + data.Length);

        if (allAudioData == null)
        {
            return;
        } else if (allAudioData.Length == 0)
        {
            allAudioData = null;
            return;
        }

        // Copy the data from allAudioData to data, if allAudioData is smaller than data, fill the rest with 0
        int k = 0;
        for (; k < allAudioData.Length && k < data.Length; k++)
        {
            data[k] = allAudioData[k];
        }

        // Remove the data that was copied from allAudioData based on k. If k is smaller than allAudioData.Length, then we need to remove the data
        float[] newData = new float[allAudioData.Length - k];
        Array.Copy(allAudioData, k, newData, 0, allAudioData.Length - k);
        allAudioData = newData;
        if (allAudioData.Length == 0)
        {
            Debug.Log("Audio finished playing");
        }

        // To prevent popping, we need to make sure that the data is 0 at the end of the clip
        for (; k < data.Length; k++)
        {
            data[k] = 0;
        }
    }

    void OnAudioSetPosition(int newPosition)
    {
        Debug.Log("OnAudioSetPosition: " + newPosition);
        position = newPosition;
    }

    // Start is called before the first frame update
    void Start()
    {
        context = NetworkScene.Register(this);

        audioSource.loop = true;
        position = 0;
        // Audio data is in raw 16Khz 16bit mono PCM format, so create an AudioClip with the correct settings
        audioSource.clip = AudioClip.Create("VoiceChat", 16000, 1, 16000, true, OnAudioRead, OnAudioSetPosition);
        audioSource.Play();
    }

    // Update is called once per frame
    void Update()
    {
        if (allAudioData == null)
        {
            audioSource.Stop();
        } else if (!audioSource.isPlaying && allAudioData.Length > 0)
        {
            audioSource.Play();
        }
        // if (allAudioData != null && !audioSource.isPlaying)
        // {
        //     audioSource.Play();
        // } else if (allAudioData == null && audioSource.isPlaying)
        // {
        //     audioSource.Stop();
        // }
    }

    // IEnumerator playAudioSequentially()
    // {
    //     //1.Loop through each AudioClip
    //     for (int i = 0; i < audioClips.Count; i++)
    //     {
    //         //2.Assign current AudioClip to audiosource
    //         audioSource.clip = audioClips[i];

    //         //3.Play Audio
    //         audioSource.Play();

    //         //3.Wait until the AudioClip is done playing
    //         while (audioSource.isPlaying)
    //         {
    //             yield return null;
    //         }
    //     }
    // }

    private float[] ConvertToFloat(byte[] bytes)
    {
        // float[] floats = new float[bytes.Length / 4];
        // for (int i = 0; i < floats.Length; i++)
        // {
        //     floats[i] = BitConverter.ToSingle(bytes, i * 4);
        // }
        // return floats;
        int Length = bytes.Length;
        byte[] Data = bytes;

        float[] DecodedData = new float[Length / 2];
        for (int i = 0; i < DecodedData.Length; i++) {
            float value = (float) System.BitConverter.ToInt16 (Data, i * 2);
            DecodedData[i] = value / (float)short.MaxValue;
        }
        return DecodedData;
    }

    public void ProcessMessage(ReferenceCountedSceneGraphMessage data)
    {
        

        // Get the audio data which is in Raw16Khz16BitMonoPcm format
        byte[] audio = data.data.ToArray();
        Debug.Log("Audio received with length: " + audio.Length);
        
        // Append the bytes to allAudioData
        if (allAudioData == null)
        {
            allAudioData = ConvertToFloat(audio);
        }
        else
        {
            float[] newAudioData = ConvertToFloat(audio);
            float[] combinedAudioData = new float[allAudioData.Length + newAudioData.Length];
            allAudioData.CopyTo(combinedAudioData, 0);
            newAudioData.CopyTo(combinedAudioData, allAudioData.Length);
            allAudioData = combinedAudioData;
        }
        // float[] audioData = ConvertToFloat(audio);
        // AudioClip audioClip = AudioClip.Create("ReceivedAudio", audioData.Length / 2, 1, 8000, false);
        // audioClip.SetData(audioData, 0);
        // // Append the audio clip to the list of audio clips to play
        // audioClips.Add(audioClip);

        // if (!audioSource.isPlaying)
        // {
        //     StartCoroutine(playAudioSequentially());
        // }
    }
}
