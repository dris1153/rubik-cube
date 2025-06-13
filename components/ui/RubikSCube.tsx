import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Matrix4, Quaternion, Vector3 } from "three";
import * as THREE from "three";

interface RubiksCubeProps {
  position?: [number, number, number];
  scale?: number;
}

const RubiksCubeModel = forwardRef<unknown, RubiksCubeProps>((props, ref) => {
  const ANIMATION_DURATION = 1.2;
  const GAP = 0.01;
  const RADIUS = 0.075;

  const mainGroupRef = useRef<THREE.Group>(null);
  const isAnimatingRef = useRef(false);
  const currentRotationRef = useRef(0);
  const lastMoveAxisRef = useRef(null);
  const currentMoveRef = useRef(null);
  const animationFrameRef = useRef(null);
  const isMountedRef = useRef(true);
  const viewportSizeRef = useRef({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const isResizingRef = useRef(false);
  const resizeTimeoutRef = useRef<number | null>(null);

  interface Cube {
    position: Vector3;
    rotationMatrix: Matrix4;
    id: string;
    originalCoords: { x: number; y: number; z: number };
  }

  const [size] = useState(0.8);
  const [cubes, setCubes] = useState<Cube[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [deviceSettings, setDeviceSettings] = useState(() => {
    const isMobile = window.innerWidth < 768;
    return {
      smoothness: isMobile ? 2 : 4,
      castShadow: !isMobile,
      receiveShadow: !isMobile,
    };
  });

  const reusableVec3 = useMemo(() => new Vector3(), []);
  const reusableMatrix4 = useMemo(() => new Matrix4(), []);
  const reusableQuaternion = useMemo(() => new Quaternion(), []);

  React.useImperativeHandle(ref, () => {
    return {
      reset: resetCube,
      ...(typeof mainGroupRef.current === "object" &&
      mainGroupRef.current !== null
        ? mainGroupRef.current
        : {}),
    };
  });

  const FACE_COLORS = {
    top: "white",
    bottom: "yellow",
    front: "red",
    back: "orange",
    left: "green",
    right: "blue",
  };

  const getFaceColorsForPosition = (x: number, y: number, z: number) => {
    const faces: Partial<Record<string, string>> = {};
    if (y === 1) faces.top = FACE_COLORS.top;
    if (y === -1) faces.bottom = FACE_COLORS.bottom;
    if (z === 1) faces.front = FACE_COLORS.front;
    if (z === -1) faces.back = FACE_COLORS.back;
    if (x === -1) faces.left = FACE_COLORS.left;
    if (x === 1) faces.right = FACE_COLORS.right;
    return faces;
  };

  const initializeCubes = useCallback(() => {
    const initial = [];
    const positions = [-1, 0, 1];

    for (const x of positions) {
      for (const y of positions) {
        for (const z of positions) {
          initial.push({
            position: new Vector3(x, y, z),
            rotationMatrix: new Matrix4().identity(),
            id: `cube-${x}-${y}-${z}`,
            originalCoords: { x, y, z },
            faceColors: getFaceColorsForPosition(x, y, z),
          });
        }
      }
    }
    return initial;
  }, []);

  useEffect(() => {
    setCubes(initializeCubes());

    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
        resizeTimeoutRef.current = null;
      }
    };
  }, [initializeCubes]);

  const resetCube = useCallback(() => {
    if (!isMountedRef.current) return;

    setCubes(initializeCubes());
    if (mainGroupRef.current) {
      mainGroupRef.current.rotation.set(0, 0, 0);
    }
    isAnimatingRef.current = false;
    currentRotationRef.current = 0;
    lastMoveAxisRef.current = null;
    currentMoveRef.current = null;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [initializeCubes]);

  const handleViewportChange = useCallback(() => {
    if (!isMountedRef.current) return;

    isResizingRef.current = true;

    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    resizeTimeoutRef.current = window.setTimeout(() => {
      if (!isMountedRef.current) return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      const visualViewportWidth = window.visualViewport
        ? window.visualViewport.width
        : width;
      const visualViewportHeight = window.visualViewport
        ? window.visualViewport.height
        : height;

      const effectiveWidth = Math.min(width, visualViewportWidth);
      const effectiveHeight = Math.min(height, visualViewportHeight);

      const prevSize = viewportSizeRef.current;
      if (
        Math.abs(prevSize.width - effectiveWidth) < 10 &&
        Math.abs(prevSize.height - effectiveHeight) < 10
      ) {
        isResizingRef.current = false;
        return;
      }

      viewportSizeRef.current = {
        width: effectiveWidth,
        height: effectiveHeight,
      };

      const isMobile = effectiveWidth < 768;
      setDeviceSettings((prevSettings) => {
        const newSettings = {
          smoothness: isMobile ? 2 : 4,
          castShadow: !isMobile,
          receiveShadow: !isMobile,
        };

        if (
          prevSettings.smoothness !== newSettings.smoothness ||
          prevSettings.castShadow !== newSettings.castShadow ||
          prevSettings.receiveShadow !== newSettings.receiveShadow
        ) {
          return newSettings;
        }
        return prevSettings;
      });

      isResizingRef.current = false;
    }, 150);
  }, []);

  useEffect(() => {
    handleViewportChange();

    let throttleTimer: string | number | NodeJS.Timeout | null | undefined =
      null;
    const throttledHandler = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        handleViewportChange();
        throttleTimer = null;
      }, 100);
    };

    window.addEventListener("resize", throttledHandler);

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", throttledHandler);
      window.visualViewport.addEventListener("scroll", throttledHandler);
    }

    const handleOrientationChange = () => {
      if (isAnimatingRef.current) {
        resetCube();
      }
      setTimeout(handleViewportChange, 100);
    };

    window.addEventListener("orientationchange", handleOrientationChange);

    return () => {
      window.removeEventListener("resize", throttledHandler);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", throttledHandler);
        window.visualViewport.removeEventListener("scroll", throttledHandler);
      }
      window.removeEventListener("orientationchange", handleOrientationChange);

      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
    };
  }, [handleViewportChange, resetCube]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!isMountedRef.current) return;
      const isPageVisible = document.visibilityState === "visible";
      setIsVisible(isPageVisible);

      if (!isPageVisible) {
        resetCube();
      } else {
        setTimeout(() => {
          if (isMountedRef.current) {
            handleViewportChange();
          }
        }, 100);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [resetCube, handleViewportChange]);

  const possibleMoves = useMemo(() => {
    const moves = [];
    for (const axis of ["x", "y", "z"]) {
      for (const layer of [-1, 0, 1]) {
        for (const direction of [1, -1]) {
          moves.push({ axis, layer, direction });
        }
      }
    }
    return moves;
  }, []);

  const isInLayer = useCallback(
    (
      position: { x: number; y: number; z: number },
      axis: string,
      layer: number
    ) => {
      const coord =
        axis === "x" ? position.x : axis === "y" ? position.y : position.z;
      return Math.abs(coord - layer) < 0.1;
    },
    []
  );

  const selectNextMove = useCallback(() => {
    if (
      !isAnimatingRef.current &&
      isVisible &&
      isMountedRef.current &&
      !isResizingRef.current
    ) {
      const availableMoves = possibleMoves.filter(
        (move) => move.axis !== lastMoveAxisRef.current
      );

      const move =
        availableMoves[Math.floor(Math.random() * availableMoves.length)];
      const rotationAngle = Math.PI / 2;

      currentMoveRef.current = { ...move, rotationAngle };
      lastMoveAxisRef.current = move.axis;
      isAnimatingRef.current = true;
      currentRotationRef.current = 0;
    } else {
    }
  }, [possibleMoves, isVisible]);

  useEffect(() => {
    let timeoutId: string | number | NodeJS.Timeout | undefined;

    const scheduleNextMove = () => {
      if (isVisible && isMountedRef.current && !isResizingRef.current) {
        const delay = isAnimatingRef.current ? ANIMATION_DURATION * 1000 : 200;

        timeoutId = setTimeout(() => {
          selectNextMove();
          if (isMountedRef.current) {
            scheduleNextMove();
          }
        }, delay);
      } else {
        if (isResizingRef.current && isVisible && isMountedRef.current) {
          setTimeout(() => {
            if (isMountedRef.current) {
              scheduleNextMove();
            }
          }, 500);
        }
      }
    };

    scheduleNextMove();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isVisible, selectNextMove]);

  const createRotationMatrix = useCallback(
    (axis, angle) => {
      reusableMatrix4.identity();
      reusableQuaternion.identity();
      reusableVec3.set(0, 0, 0);

      reusableVec3[axis] = 1;
      reusableQuaternion.setFromAxisAngle(reusableVec3, angle);
      return reusableMatrix4.makeRotationFromQuaternion(reusableQuaternion);
    },
    [reusableMatrix4, reusableQuaternion, reusableVec3]
  );

  const easeInOutQuad = useCallback((t) => {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }, []);

  const matrixToQuaternion = useCallback(
    (matrix) => {
      reusableQuaternion.setFromRotationMatrix(matrix);
      return reusableQuaternion.clone();
    },
    [reusableQuaternion]
  );

  const normalizePositions = useCallback((cubes) => {
    return cubes.map((cube) => {
      const x = Math.round(cube.position.x);
      const y = Math.round(cube.position.y);
      const z = Math.round(cube.position.z);

      const newPosition =
        Math.abs(cube.position.x - x) > 0.001 ||
        Math.abs(cube.position.y - y) > 0.001 ||
        Math.abs(cube.position.z - z) > 0.001
          ? new Vector3(x, y, z)
          : cube.position;

      return {
        ...cube,
        position: newPosition,
      };
    });
  }, []);

  const checkCubeIntegrity = useCallback((cubes) => {
    if (cubes.length !== 27) {
      console.warn("Incorrect number of cubes:", cubes.length);
      return false;
    }

    for (const cube of cubes) {
      const { x, y, z } = cube.position;
      if (Math.abs(x) > 1.1 || Math.abs(y) > 1.1 || Math.abs(z) > 1.1) {
        console.warn("Cube out of range:", cube.id, x, y, z);
        return false;
      }
    }

    return true;
  }, []);

  const updateCubes = useCallback(
    (prevCubes, move, stepRotationMatrix) => {
      return prevCubes.map((cube) => {
        if (isInLayer(cube.position, move.axis, move.layer)) {
          const tempVec3 = new Vector3(
            cube.position.x,
            cube.position.y,
            cube.position.z
          );

          tempVec3.applyMatrix4(stepRotationMatrix);

          const newRotationMatrix = new Matrix4().multiplyMatrices(
            stepRotationMatrix,
            cube.rotationMatrix
          );

          return {
            ...cube,
            position: tempVec3,
            rotationMatrix: newRotationMatrix,
          };
        }
        return cube;
      });
    },
    [isInLayer]
  );

  useFrame((state, delta) => {
    if (!isVisible || !isMountedRef.current) return;

    if (mainGroupRef.current) {
      mainGroupRef.current.rotation.x += delta * 0.3;
      mainGroupRef.current.rotation.y += delta * 0.5;
      mainGroupRef.current.rotation.z += delta * 0.2;
    }

    if (isResizingRef.current && isAnimatingRef.current) {
      resetCube();
      return;
    }

    if (isAnimatingRef.current && currentMoveRef.current) {
      const move = currentMoveRef.current;
      const targetRotation = move.rotationAngle;
      const rotation = delta / ANIMATION_DURATION;

      if (currentRotationRef.current < 1) {
        const newRotation = Math.min(currentRotationRef.current + rotation, 1);
        const prevRotation = currentRotationRef.current;
        currentRotationRef.current = newRotation;

        const easedProgress = easeInOutQuad(newRotation);
        const prevEasedProgress = easeInOutQuad(prevRotation);
        const currentAngle = easedProgress * targetRotation;
        const prevAngle = prevEasedProgress * targetRotation;
        const stepRotation = currentAngle - prevAngle;

        const stepRotationMatrix = createRotationMatrix(
          move.axis,
          stepRotation * move.direction
        );

        if (isMountedRef.current && !isResizingRef.current) {
          setCubes((prevCubes) => {
            const updatedCubes = updateCubes(
              prevCubes,
              move,
              stepRotationMatrix
            );

            if (newRotation >= 1) {
              const normalizedCubes = normalizePositions(updatedCubes);

              if (!checkCubeIntegrity(normalizedCubes)) {
                console.warn("Found a cube out of bounds");
                if (isMountedRef.current) {
                  setTimeout(() => resetCube(), 0);
                }
              }

              isAnimatingRef.current = false;
              currentRotationRef.current = 0;
              currentMoveRef.current = null;

              return normalizedCubes;
            }

            return updatedCubes;
          });
        }
      }
    }
  });

  // const chromeMaterial = useMemo(
  //   () => ({
  //     color: "#FFEC86",
  //     metalness: 0.5,
  //     roughness: 0.5,
  //     clearcoat: 0,
  //     clearcoatRoughness: 0,
  //     reflectivity: 0.5,
  //     iridescence: 0,
  //     iridescenceIOR: 0,
  //     iridescenceThicknessRange: [100, 400],
  //     envMapIntensity: 8,
  //   }),
  //   []
  // );

  // const sharedMaterial = useMemo(
  //   () => <meshPhysicalMaterial {...chromeMaterial} />,
  //   [chromeMaterial]
  // );

  return (
    <group ref={mainGroupRef} {...props}>
      {cubes.map((cube) => (
        <group
          key={cube.id}
          position={[
            cube.position.x * (size + GAP),
            cube.position.y * (size + GAP),
            cube.position.z * (size + GAP),
          ]}
          quaternion={matrixToQuaternion(cube.rotationMatrix)}
        >
          <RoundedBox
            args={[size, size, size]}
            radius={RADIUS}
            smoothness={deviceSettings.smoothness}
            castShadow={deviceSettings.castShadow}
            receiveShadow={deviceSettings.receiveShadow}
          >
            <meshPhysicalMaterial
              color={"#111"} // dark base
              metalness={0.3}
              roughness={0.7}
            />
          </RoundedBox>

          {/* Face stickers (like labels) */}
          {Object.entries(cube.faceColors).map(([face, color]) => {
            const epsilon = 0.001;
            const half = size / 2;
            const offset = half + epsilon;

            const facePosition = {
              top: [0, offset, 0],
              bottom: [0, -offset, 0],
              front: [0, 0, offset],
              back: [0, 0, -offset],
              left: [-offset, 0, 0],
              right: [offset, 0, 0],
            }[face];

            const faceRotation = {
              top: [Math.PI / 2, 0, 0],
              bottom: [-Math.PI / 2, 0, 0],
              front: [0, 0, 0],
              back: [0, Math.PI, 0],
              left: [0, Math.PI / 2, 0],
              right: [0, -Math.PI / 2, 0],
            }[face];

            return (
              <mesh
                key={face}
                position={facePosition}
                rotation={faceRotation}
                renderOrder={1} // ensure it's on top
              >
                <planeGeometry args={[size * 0.95, size * 0.95]} />
                <meshBasicMaterial
                  color={color}
                  side={THREE.DoubleSide}
                  polygonOffset
                  polygonOffsetFactor={-1}
                />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
});

RubiksCubeModel.displayName = "RubiksCubeModel";

export default RubiksCubeModel;
