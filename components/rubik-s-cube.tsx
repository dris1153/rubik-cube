import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useDepthBuffer } from "@react-three/drei";
import * as THREE from "three";
import React, { Suspense, useState, useEffect } from "react";
import RubiksCubeModel from "./ui/RubikSCube";
import CameraController from "./ui/CameraController";
import EnhancedSpotlight from "./ui/EnhancedSpotlight";

function SceneContent() {
  const depthBuffer = useDepthBuffer({
    size: 2048,
    frames: 1,
    // disableRenderLoop: true,
  });

  const [, setTime] = useState(0);

  useFrame((state) => {
    setTime(state.clock.getElapsedTime());
  });

  return (
    <>
      {/* Basic light setup */}
      {/* <ambientLight intensity={0.5} /> */}
      <directionalLight position={[-5, 5, 5]} intensity={1.2} castShadow />

      <EnhancedSpotlight
        depthBuffer={depthBuffer}
        color="#ff1e3c"
        position={[3, 3, 2]}
        volumetric={true}
        opacity={1}
        penumbra={1}
        distance={17}
        angle={0.8}
        attenuation={30}
        anglePower={6}
        intensity={1}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
        castShadow={true}
      />

      <PerspectiveCamera
        makeDefault
        fov={50}
        position={[0, 0, 7]}
        near={0.1}
        far={1000}
      />

      <CameraController />

      <Suspense fallback={null}>
        <RubiksCubeModel position={[0, 0, 0]} scale={1} />
      </Suspense>
    </>
  );
}

export function Scene() {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    checkIsDesktop();

    window.addEventListener("resize", checkIsDesktop);

    return () => window.removeEventListener("resize", checkIsDesktop);
  }, []);

  return (
    <div className="h-svh w-screen relative bg-black">
      <Canvas
        shadows
        gl={{
          antialias: isDesktop,
          preserveDrawingBuffer: isDesktop,
          powerPreference: isDesktop ? "high-performance" : "default",
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1,
        }}
      >
        <SceneContent />
        {/* <Perf /> */}
      </Canvas>
    </div>
  );
}
