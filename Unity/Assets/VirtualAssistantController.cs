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
using Ubiq.Avatars;

public class VirtualAssistantController : MonoBehaviour
{
    public HandMover handMover;
    public float turnSpeed = 10.0f;

    private string assistantSpeechTargetPeerName;
    private float assistantSpeechVolume;
    private float minAssistantSpeechVolume;
    private float maxAssistantSpeechVolume;
    private IPeer lastTargetPeer;

    private RoomClient roomClient;
    private AvatarManager avatarManager;
    private VoipPeerConnectionManager peerConnectionManager;

    public void SetAssistantSpeechVolumeRange(float min, float max)
    {
        this.minAssistantSpeechVolume = min;
        this.maxAssistantSpeechVolume = max;
    }

    public void UpdateAssistantSpeechStatus(string targetPeerName, float volume)
    {
        assistantSpeechTargetPeerName = targetPeerName;
        assistantSpeechVolume = volume;
    }

    void Update()
    {
        UpdateHands();
        UpdateTurn();
    }

    void UpdateHands()
    {
        if (handMover)
        {
            if (assistantSpeechVolume > minAssistantSpeechVolume)
            {
                handMover.Play();
            }
            else
            {
                handMover.Stop();
            }
        }
    }

    void UpdateTurn()
    {
        if (!roomClient)
        {
            roomClient = NetworkScene.Find(this).GetComponent<RoomClient>();
            if (!roomClient)
            {
                return;
            }
        }
        if (!avatarManager)
        {
            avatarManager = roomClient.GetComponentInChildren<AvatarManager>();
            if (!avatarManager)
            {
                return;
            }
        }

        var targetPeer = null as IPeer;
        if (!string.IsNullOrEmpty(assistantSpeechTargetPeerName))
        {
            // Speech target specified: find the corresponding peer
            foreach(var peer in roomClient.Peers)
            {
                Debug.Log(peer.uuid);
                if (peer["ubiq.samples.social.name"] == assistantSpeechTargetPeerName)
                {
                    targetPeer = peer;
                    break;
                }
            }
            if (roomClient.Me["ubiq.samples.social.name"] == assistantSpeechTargetPeerName)
            {
                targetPeer = roomClient.Me;
            }
        }
        else
        {
            var loudestVolume = 0.0f;
            // No speech target specified: find the loudest current peer
            foreach(var avatar in avatarManager.Avatars)
            {
                var volumeEstimator = avatar.GetComponentInChildren<GenieSpeechVolumeEstimator>();
                if (volumeEstimator)
                {
                    var speechIndicator = avatar.GetComponentInChildren<SpeechIndicator>();
                    var minVolume = speechIndicator ? speechIndicator.minVolume : 0.0f;
                    var volume = volumeEstimator.EstimateCurrentVolume();
                    if (volume > loudestVolume && volume > minVolume)
                    {
                        targetPeer = avatar.Peer;
                        loudestVolume = volume;
                    }
                }
            }
        }

        if (targetPeer == null)
        {
            targetPeer = lastTargetPeer;

            if (targetPeer == null)
            {
                return;
            }
        }

        Debug.Log(targetPeer.uuid);

        var targetAvatar = null as Ubiq.Avatars.Avatar;
        foreach(var avatar in avatarManager.Avatars)
        {
            if (avatar.Peer == targetPeer)
            {
                targetAvatar = avatar;
                break;
            }
        }

        if (!targetAvatar)
        {
            return;
        }

        var floatingAvatar = targetAvatar.GetComponent<FloatingAvatar>();
        if (!floatingAvatar)
        {
            return;
        }

        var position = floatingAvatar.head.position;

        var facingDirection = position - transform.position;
        facingDirection = new Vector3(facingDirection.x, 0, facingDirection.z);

        transform.rotation = Quaternion.Slerp(transform.rotation,
            Quaternion.LookRotation(facingDirection), turnSpeed * Time.deltaTime);

        lastTargetPeer = targetPeer;

        // var assistantFloatingAvatar = GetComponent<FloatingAvatar>();
        // if (!assistantFloatingAvatar)
        // {
        //     return;
        // }
        // facingDirection = position - transform.position;
        // var assistantHead = assistantFloatingAvatar.head;
        // assistantHead.rotation = Quaternion.Slerp(assistantHead.rotation,
        //     Quaternion.LookRotation(facingDirection,Vector3.up), turnSpeed * Time.deltaTime);
    }
}
