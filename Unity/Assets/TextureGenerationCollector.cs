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

[NetworkComponentId(typeof(TextureGenerationCollector), ComponentId)]
public class TextureGenerationCollector : MonoBehaviour, INetworkComponent
{
    public const ushort ComponentId = 97;
    public NetworkId networkId = new NetworkId(97);
    private NetworkContext context;
    public GameObject plane;
    public string assetPath;

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
        assetPath = Application.streamingAssetsPath;
    }

    // Update is called once per frame
    void Update()
    {
        
    }

    void LoadTexture(string fullPath)
    {
        File.Copy(fullPath, Path.Combine(assetPath, "panel.png"), true);
        string panelUrl = assetPath + "/" + "panel.png";
        byte[] pngBytes = System.IO.File.ReadAllBytes(panelUrl);
        Texture2D tex = new Texture2D(2, 2);
        ImageConversion.LoadImage(tex, pngBytes);
        plane.GetComponent<Renderer>().material.mainTexture = tex;
    }
    
    public void ProcessMessage(ReferenceCountedSceneGraphMessage data)
    {
        LoadTexture(data.FromJson<Message>().data.ToString().Trim('\r', '\n'));
    }
}
