using UnityEngine;
using UnityEngine.Events;
using System.Collections;
using System;
using System.Linq;
using Ubiq.XR;

namespace Ubiq.XR
{
    [RequireComponent(typeof(LineRenderer))]
    public class SelectRay : MonoBehaviour
    {
        [Serializable]
        public class TeleportEvent : UnityEvent<Vector3>
        { }

        public TeleportEvent OnTeleport;

        [HideInInspector]
        public Vector3 teleportLocation;

        [HideInInspector]
        public bool teleportLocationValid;

        public bool isTeleporting;

        public GameObject selectedObject;
        public int selectedSubmeshIndex;
        public string selectedMaterialName;

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
            foreach (IPrimaryButtonProvider item in GetComponentsInParent<MonoBehaviour>().Where(c => c is IPrimaryButtonProvider))
            {
                item.PrimaryButtonPress.AddListener(UpdateTeleport);
            }
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
        }

        private void ComputeStraightRay()
        {
            teleportLocationValid = false;
            renderer.sharedMaterial.color = invalidColour;

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

                renderer.sharedMaterial.color = collisionColour;
            }

            renderer.positionCount = 2;
            renderer.SetPositions(positions);

            renderer.startWidth = 0.01f;
            renderer.endWidth = 0.01f;

            if (teleportLocationValid)
            {
                renderer.sharedMaterial.color = validColour;
            }

            PrintSubmeshName(raycasthitinfo);
        }

        private void PrintSubmeshName(RaycastHit raycasthitinfo)
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
                                selectedObject = raycasthitinfo.collider.gameObject;
                                selectedMaterialName = selectedObject.GetComponent<Renderer>().materials[i].name;
                                Debug.Log("Hit material " + selectedMaterialName);
                                selectedSubmeshIndex = i;
                                // submeshRenderer = meshCollider.gameObject.GetComponent<Renderer>().materials;
                                // submeshRenderer[i].color = Color.red;
                                break;
                            }
                        }
                    }
                }
            }
        }
    }
}
