using UnityEngine;
using UnityEngine.Events;
using System.Collections;
using System;
using System.Linq;
using Ubiq.XR;
using Ubiq.Networking;
using Ubiq.Logging;
using Ubiq.Voip;
using Ubiq.Rooms;
using Ubiq.Messaging;
using Ubiq.Logging.Utf8Json;

public class GenieLogEmitter : LogEmitter
{
    private Ubiq.Rooms.IPeer me;

    public GenieLogEmitter(Ubiq.Rooms.IPeer me, MonoBehaviour component) :
        base(Ubiq.Logging.EventType.Application,component)
    {
        this.me = me;
    }

    protected override void WriteHeader(ref JsonWriter writer)
    {
        writer.Write("ticks", DateTime.UtcNow.Ticks);
        writer.Write("peer", me.uuid);
    }
}

[RequireComponent(typeof(LineRenderer))]
public class SelectRay : MonoBehaviour
{
    private NetworkContext context;
    private RoomClient roomClient;
    public NetworkId networkId = new NetworkId(93);

    [Serializable]
    public class TeleportEvent : UnityEvent<Vector3>
    { }

    public TeleportEvent OnTeleport;
    private LogEmitter SelectionLogger;

    [HideInInspector]
    public Vector3 teleportLocation;

    [HideInInspector]
    public bool teleportLocationValid;

    public bool isTeleporting;

    public GameObject selectedObject;
    public int selectedSubmeshIndex;
    public string selectedMaterialName;
    private string lastSelectedObjectMaterialString;

    private HandController handController;

    public TextureGenerationCollector textureGenerationCollector;
    public MicrophoneCapture genieMicrophoneCapture;

    private new LineRenderer renderer;

    private readonly float range = 8f;
    private readonly float curve = 20f;
    private readonly int segments = 50;

    private Color validColour = new Color(0f, 1f, 0f, 0.4f);
    private Color collisionColour = new Color(1f, 1f, 0f, 0.4f);
    private Color invalidColour = new Color(1f, 0f, 0f, 0.4f);

    private void Awake()
    {
        renderer = GetComponent<LineRenderer>();
        renderer.useWorldSpace = true;

        if (OnTeleport == null)
        {
            OnTeleport = new TeleportEvent();
        }
    }

    private void Start()
    {
        context = NetworkScene.Register(this, networkId);

        foreach (IPrimaryButtonProvider item in GetComponentsInParent<MonoBehaviour>().Where(c => c is IPrimaryButtonProvider))
        {
            item.PrimaryButtonPress.AddListener(UpdateTeleport);
            item.PrimaryButtonPress.AddListener(listenForCommand);
        }

        // Get HandController in parent
        handController = GetComponentsInParent<MonoBehaviour>().Where(c => c is HandController).FirstOrDefault() as HandController;
        handController.TriggerPress.AddListener(listenForCommand);

        // handController.TriggerPress.AddListener(listenForCommand);
        // handController.TriggerPress.AddListener(UpdateTeleport);

        var roomClient = NetworkScene.Find(this).GetComponentInChildren<RoomClient>();
        SelectionLogger = new GenieLogEmitter(roomClient.Me,this);
    }

    public void listenForCommand(bool listen)
    {
        genieMicrophoneCapture.gain = listen ? 1.0f : 0.0f;
    }

    public void UpdateTeleport(bool teleporterActivation)
    {
        if (teleporterActivation)
        {
            isTeleporting = true;
        }
        else
        {
            if (teleportLocationValid)
            {
                OnTeleport.Invoke(teleportLocation);
            }

            isTeleporting = false;
        }
    }

    private void SendCurrentSelection(string currentObjectMaterialString)
    {
        byte[] materialStringByte = System.Text.Encoding.UTF8.GetBytes(currentObjectMaterialString);

        // Get the client UUID
        byte[] clientUUID = System.Text.Encoding.UTF8.GetBytes(roomClient.Me.uuid);

        // Create a message that fits the client UUID and the string
        var message = ReferenceCountedSceneGraphMessage.Rent(materialStringByte.Length + clientUUID.Length);

        // Copy the client UUID and the string into the message
        clientUUID.CopyTo(new Span<byte>(message.bytes, message.start, clientUUID.Length));
        materialStringByte.CopyTo(new Span<byte>(message.bytes, message.start + clientUUID.Length, materialStringByte.Length));

        // Send the message to the server with a fixed network ID
        context.Send(message);
    }

    private void Update()
    {
        if (isTeleporting)
        {
            ComputeStraightRay();
            renderer.enabled = true;
        }
        else
        {
            renderer.enabled = false;
        }

        if (!roomClient)
        {
            roomClient = NetworkScene.Find(this)?.GetComponentInChildren<RoomClient>();
            if (!roomClient)
            {
                return;
            }
        }
    }

    private void ComputeStraightRay()
    {
        teleportLocationValid = false;
        renderer.sharedMaterial.color = validColour;

        var positions = new Vector3[2];

        RaycastHit raycasthitinfo;

        positions[0] = transform.position;
        positions[1] = transform.position + transform.forward * range;

        if (Physics.Linecast(positions[0], positions[1], out raycasthitinfo))
        {
            if (raycasthitinfo.collider.CompareTag("Teleport"))
            {
                positions[1] = raycasthitinfo.point;
                teleportLocation = raycasthitinfo.point;
                teleportLocationValid = true;
            }

            // renderer.sharedMaterial.color = collisionColour;
        }

        renderer.positionCount = 2;
        renderer.SetPositions(positions);

        renderer.startWidth = 0.01f;
        renderer.endWidth = 0.01f;

        string currentObjectMaterialString = GetSubmeshName(raycasthitinfo);
        if (currentObjectMaterialString != "")// && currentObjectMaterialString != lastSelectedObjectMaterialString)
        {
            // textureGenerationCollector.sendSelectedObjectMessage(currentObjectMaterialString);

            // SelectionLogger.Log(currentObjectMaterialString);
            // context.Send(currentObjectMaterialString);
            SendCurrentSelection(currentObjectMaterialString);
            lastSelectedObjectMaterialString = currentObjectMaterialString;
        }
    }

    private string GetSubmeshName(RaycastHit raycasthitinfo)
    {
        if (raycasthitinfo.collider != null)
        {
            var meshCollider = raycasthitinfo.collider as MeshCollider;
            if (meshCollider != null && meshCollider.sharedMesh != null)
            {
                Debug.Log("Hit mesh " + meshCollider.sharedMesh.name);
                var mesh = meshCollider.sharedMesh;
                var submeshes = mesh.subMeshCount;
                for (int i = 0; i < submeshes; i++)
                {
                    var indices = mesh.GetIndices(i);
                    for (int j = 0; j < indices.Length; j += 3)
                    {
                        if (indices[j] == raycasthitinfo.triangleIndex ||
                            indices[j + 1] == raycasthitinfo.triangleIndex ||
                            indices[j + 2] == raycasthitinfo.triangleIndex)
                        {
                            Debug.Log("Hit submesh " + i);
                            string currentObjectName = raycasthitinfo.collider.gameObject.name;
                            string currentMaterialName = raycasthitinfo.collider.gameObject.GetComponent<Renderer>().materials[i].name;
                            Debug.Log("Hit material " + currentMaterialName);
                            // selectedSubmeshIndex = i;
                            // submeshRenderer = meshCollider.gameObject.GetComponent<Renderer>().materials;
                            // submeshRenderer[i].color = Color.red;
                            return currentObjectName + ":" + currentMaterialName;
                        }
                    }
                }
            }
        }
        return "";
    }

    // We only send messages to the server, so we don't need to implement this method
    public void ProcessMessage(ReferenceCountedSceneGraphMessage msg)
    {
    }
}
