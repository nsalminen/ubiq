using System.Collections;
using System.Collections.Generic;
using Ubiq.Networking;
using UnityEngine;
using Ubiq.Dictionaries;
using Ubiq.Messaging;
using Ubiq.Logging.Utf8Json;
using Ubiq.Rooms;
using System;
using System.IO;
using System.Text;
using UnityEngine.Networking;
using Ubiq.XR;

[NetworkComponentId(typeof(TextureGenerationCollector), ComponentId)]
public class TextureGenerationCollector : MonoBehaviour, INetworkComponent
{
    public const ushort ComponentId = 97;
    public NetworkId networkId = new NetworkId(97);
    private NetworkContext context;
    public string serverBaseUrl;

    public SelectRay selectRay;
    private bool paintAll = false;

    [Serializable]
    private struct Message
    {
        public string type;
        public string target;
        public string data;
    }

    [Serializable]
    public struct ObjectTargetKeywords {
        public GameObject targetObject;
        public int targetSubmeshIndex;
        public string[] targetKeywords;
    }
    public ObjectTargetKeywords[] targets;
    private GameObject currentTarget;

    // Start is called before the first frame update
    void Start()
    {
        context = NetworkScene.Register(this);
    }

    // Update is called once per frame
    void Update()
    {
        
    }

    private void SetTexture(Texture2D newTexture) {
        // currentTarget.GetComponent<Renderer>().material.mainTexture = newTexture;
        // If paintAll, paint the sharedMaterial instead of material
        if (paintAll) {
            currentTarget.GetComponent<Renderer>().sharedMaterials[selectRay.selectedSubmeshIndex].mainTexture = newTexture;
            currentTarget.GetComponent<Renderer>().sharedMaterials[selectRay.selectedSubmeshIndex].mainTextureScale = new Vector2(0.02f, 0.02f);
        } else {
            currentTarget.GetComponent<Renderer>().materials[selectRay.selectedSubmeshIndex].mainTexture = newTexture;
            currentTarget.GetComponent<Renderer>().materials[selectRay.selectedSubmeshIndex].mainTextureScale = new Vector2(0.02f, 0.02f);
        }
        // selectRay.selectedObject.GetComponent<Renderer>().materials[selectRay.selectedSubmeshIndex].mainTexture = newTexture;
        // Set texture scale to 0.15
    }

    void LoadPNGFromURL(string url, System.Action<Texture2D> onComplete)
    {
        UnityWebRequest www = UnityWebRequestTexture.GetTexture(url);
        www.SendWebRequest().completed += operation =>
        {
            if (www.isNetworkError || www.isHttpError)
            {
                Debug.Log(www.error);
                onComplete(null);
            }
            else
            {
                Texture2D texture = DownloadHandlerTexture.GetContent(www);
                onComplete(texture);
            }
        };
    }
    
    public void ProcessMessage(ReferenceCountedSceneGraphMessage data)
    {
        Message message = data.FromJson<Message>();
        if (message.target.ToLower() == "this") {
            currentTarget = selectRay.selectedObject;
            paintAll = false;
        } else if (message.target.ToLower() == "all of these") {
            currentTarget = selectRay.selectedObject;
            paintAll = true;
        } else {
            if (message.target.ToLower().StartsWith("all")) {
                paintAll = true;
                message.target = message.target.Substring(3); // Remove "all" from the message.target
                Debug.Log("Painting all" + message.target);
            } else {
                paintAll = false;
            }
            
            for (int i = 0; i < targets.Length; i++) {
                for (int j = 0; j < targets[i].targetKeywords.Length; j++) {
                    if (message.target.Contains(targets[i].targetKeywords[j])) {
                        currentTarget = targets[i].targetObject;
                    }
                }
            }
        }

        if (currentTarget != null) {
            string fileName = message.data.ToString().Trim('\r', '\n');
            LoadPNGFromURL(serverBaseUrl + fileName, SetTexture);
        } else {
            Debug.Log("No target found for " + message.target);
        }
    }
}
