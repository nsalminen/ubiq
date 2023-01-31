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

    private string assistantSpeechTargetPeerUuid;
    private float assistantSpeechVolume;
    private float minAssistantSpeechVolume;
    private float maxAssistantSpeechVolume;

    private RoomClient roomClient;
    private AvatarManager avatarManager;

    public void SetAssistantSpeechVolumeRange(float min, float max)
    {
        this.minAssistantSpeechVolume = min;
        this.maxAssistantSpeechVolume = max;
    }

    public void UpdateAssistantSpeechStatus(string targetPeerUuid, float volume)
    {
        assistantSpeechTargetPeerUuid = targetPeerUuid;
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
        if (!string.IsNullOrEmpty(assistantSpeechTargetPeerUuid))
        {
            if (!roomClient)
            {
                roomClient = NetworkScene.FindNetworkScene(this).GetComponent<RoomClient>();
                if (!roomClient)
                {
                    return;
                }
            }

            var targetPeer = null as IPeer;
            foreach(var peer in roomClient.Peers)
            {
                Debug.Log(peer.UUID);
                if (peer.UUID == assistantSpeechTargetPeerUuid)
                {
                    targetPeer = peer;
                    break;
                }
            }
            if (roomClient.Me.UUID == assistantSpeechTargetPeerUuid)
            {
                targetPeer = roomClient.Me;
            }

            if (targetPeer == null)
            {
                return;
            }

            if (!avatarManager)
            {
                avatarManager = roomClient.GetComponentInChildren<AvatarManager>();
                if (!avatarManager)
                {
                    return;
                }
            }

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
}
