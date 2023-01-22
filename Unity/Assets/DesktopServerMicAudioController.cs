using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Ubiq.Voip;

public class DesktopServerMicAudioController : MonoBehaviour
{
    public VoipPeerConnectionManager voipPeerConnectionManager;
    public bool desktopMode = false;

    // Start is called before the first frame update
    void Start()
    {
        desktopMode = Application.platform == RuntimePlatform.WindowsEditor || Application.platform == RuntimePlatform.WindowsPlayer || Application.platform == RuntimePlatform.OSXEditor || Application.platform == RuntimePlatform.OSXPlayer;
    }

    // Update is called once per frame
    void Update()
    {
        // Add a listener for space bar if deployed to mac or windows or when viewed in the editor
        if (desktopMode)
        {
            // Check for key down event for space bar
            if (Input.GetKeyDown(KeyCode.Space))
            {
                listenForCommand(true);
            }
            else if (Input.GetKeyUp(KeyCode.Space))
            {
                listenForCommand(false);
            }
        }   
    }

    public void listenForCommand(bool listen)
    {
        voipPeerConnectionManager.triggerSendingAudioToServer = listen;
    }
}
