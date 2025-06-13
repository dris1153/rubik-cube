import { SpotLight, SpotLightProps } from "@react-three/drei";
import { useEffect, useRef } from "react";
import * as THREE from "three";

function EnhancedSpotlight(props: SpotLightProps) {
  const light = useRef<THREE.SpotLight>(null);

  // Uncomment to see a visual helper for the spotlight
  //useHelper(spotlightRef, THREE.SpotLightHelper, 'red');

  useEffect(() => {
    if (light.current) {
      light.current.target.position.set(0, 0, 0);
      light.current.target.updateMatrixWorld();
    }
  }, []);

  return (
    <>
      <SpotLight castShadow={false} ref={light} {...props} />
    </>
  );
}

export default EnhancedSpotlight;
