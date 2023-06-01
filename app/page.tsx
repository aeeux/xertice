"use client";

import { useState, Suspense, useRef, useEffect } from "react";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { Environment, OrbitControls, Plane } from "@react-three/drei";
import * as THREE from "three";
import { detectEdges, addEdgesToScene } from "../component/detectSharpPoints";

const Model = ({ file }: { file: File }) => {
  const reader = new FileReader();
  const [url, setUrl] = useState<string | null>(null);
  const { scene } = useThree();

  reader.onload = () => {
    setUrl(reader.result as string);
  };

  reader.readAsDataURL(file);

  const geometry = url ? useLoader(STLLoader, url) : null;

  useEffect(() => {
    if (geometry) {
      // Detect edges
      const edges = detectEdges(geometry);

      // Add edges to the scene
      addEdgesToScene(edges, scene);
    }
  }, [geometry, scene]);

  if (geometry) {
    return (
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color={0x888888}
          roughness={0.5}
          metalness={0.5}
        />
      </mesh>
    );
  } else {
    return null;
  }
};

const FoggyScene = () => {
  const { scene } = useThree();
  scene.fog = new THREE.Fog("white", 400, 1000);
  return null;
};

const SharpPointAnalysis = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <input ref={fileInputRef} type="file" onChange={handleFileUpload} />
      {file && (
        <Canvas
          style={{ background: "white" }}
          camera={{ position: [0, 0, 100], fov: 75 }}
        >
          <FoggyScene />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 10]} />
          <Suspense fallback={null}>
            <Model file={file} />
            <Environment files="sunset_cold_4k.hdr" />
            {/* Update with your simpler HDR image path */}
          </Suspense>
          <OrbitControls />
        </Canvas>
      )}
    </div>
  );
};

export default SharpPointAnalysis;
