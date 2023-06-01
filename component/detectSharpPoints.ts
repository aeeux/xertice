import * as THREE from "three";

//Detectors

export function detectEdges(geometry: THREE.BufferGeometry): THREE.Line3[] {
  const edges: THREE.Line3[] = [];
  const positionAttribute = geometry.attributes.position;
  const thresholdAngle = Math.PI / 4;

  for (let i = 0; i < positionAttribute.count; i += 9) {
    const vertices = [
      new THREE.Vector3(
        positionAttribute.array[i],
        positionAttribute.array[i + 1],
        positionAttribute.array[i + 2]
      ),
      new THREE.Vector3(
        positionAttribute.array[i + 3],
        positionAttribute.array[i + 4],
        positionAttribute.array[i + 5]
      ),
      new THREE.Vector3(
        positionAttribute.array[i + 6],
        positionAttribute.array[i + 7],
        positionAttribute.array[i + 8]
      ),
    ];

    const faceNormal = new THREE.Vector3().crossVectors(
      new THREE.Vector3().subVectors(vertices[1], vertices[0]),
      new THREE.Vector3().subVectors(vertices[2], vertices[0])
    );

    for (let j = 0; j < 3; j++) {
      const edge = new THREE.Line3(vertices[j], vertices[(j + 1) % 3]);
      const otherFaceNormal = new THREE.Vector3();

      for (let k = 0; k < positionAttribute.count; k += 9) {
        const otherVertices = [
          new THREE.Vector3(
            positionAttribute.array[k],
            positionAttribute.array[k + 1],
            positionAttribute.array[k + 2]
          ),
          new THREE.Vector3(
            positionAttribute.array[k + 3],
            positionAttribute.array[k + 4],
            positionAttribute.array[k + 5]
          ),
          new THREE.Vector3(
            positionAttribute.array[k + 6],
            positionAttribute.array[k + 7],
            positionAttribute.array[k + 8]
          ),
        ];

        if (
          otherVertices.some((vertex) => vertex.equals(vertices[j])) &&
          otherVertices.some((vertex) => vertex.equals(vertices[(j + 1) % 3]))
        ) {
          otherFaceNormal.crossVectors(
            new THREE.Vector3().subVectors(otherVertices[1], otherVertices[0]),
            new THREE.Vector3().subVectors(otherVertices[2], otherVertices[0])
          );
          break;
        }
      }

      if (faceNormal.angleTo(otherFaceNormal) < thresholdAngle) {
        edges.push(edge);
      }
    }
  }

  return edges;
}

const detectSharpEdge = (
  edge: THREE.Line3,
  geometry: THREE.BufferGeometry,
  angleThreshold: number
): boolean => {
  const normal1 = calculateFaceNormal(edge.start, edge.end, geometry);
  const normal2 = calculateFaceNormal(edge.end, edge.start, geometry);

  const angle = normal1.angleTo(normal2);

  return angle < angleThreshold;
};

export function addEdgesToScene(edges: THREE.Line3[], scene: THREE.Scene) {
  edges.forEach((edge) => {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      edge.start,
      edge.end,
    ]);
    const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const line = new THREE.Line(geometry, material);
    scene.add(line);
  });
}

//calculators

const calculateFaceNormal = (
  vertex1: THREE.Vector3,
  vertex2: THREE.Vector3,
  geometry: THREE.BufferGeometry
): THREE.Vector3 => {
  const positionAttribute = geometry.attributes.position;
  const indexAttribute = geometry.index!;

  const faceNormal = new THREE.Vector3();

  for (let i = 0; i < indexAttribute.count; i += 3) {
    const vertices = [
      new THREE.Vector3().fromBufferAttribute(
        positionAttribute,
        indexAttribute.getX(i)
      ),
      new THREE.Vector3().fromBufferAttribute(
        positionAttribute,
        indexAttribute.getX(i + 1)
      ),
      new THREE.Vector3().fromBufferAttribute(
        positionAttribute,
        indexAttribute.getX(i + 2)
      ),
    ];

    if (
      vertices.some((vertex) => vertex.equals(vertex1)) &&
      vertices.some((vertex) => vertex.equals(vertex2))
    ) {
      // Calculate the normal of the face
      const edge1 = new THREE.Vector3().subVectors(vertices[1], vertices[0]);
      const edge2 = new THREE.Vector3().subVectors(vertices[2], vertices[0]);
      const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

      faceNormal.add(normal);
    }
  }

  return faceNormal.normalize();
};
