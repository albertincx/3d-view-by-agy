import { useEffect, useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PointerLockControls, useKeyboardControls, Environment } from '@react-three/drei'
import * as THREE from 'three'
import roomConfig from './room.json'

interface ExperienceProps {
    isMobile: boolean
}

// Helper to generate wall parts with a window hole
const WallWithWindow = ({ width, height, thickness, windowConfig, color }: any) => {
    const { width: wineWidth, height: winHeight, y: winY } = windowConfig;

    // Calculate wall segments
    const topHeight = height - (winY + winHeight / 2);
    const bottomHeight = winY - winHeight / 2;
    const sideWidth = (width - wineWidth) / 2;

    return (
        <group>
            {/* Left */}
            <mesh position={[-width / 2 + sideWidth / 2, 0, 0]} receiveShadow castShadow>
                <boxGeometry args={[sideWidth, height, thickness]} />
                <meshStandardMaterial color={color} />
            </mesh>
            {/* Right */}
            <mesh position={[width / 2 - sideWidth / 2, 0, 0]} receiveShadow castShadow>
                <boxGeometry args={[sideWidth, height, thickness]} />
                <meshStandardMaterial color={color} />
            </mesh>
            {/* Top */}
            <mesh position={[0, height / 2 - topHeight / 2, 0]} receiveShadow castShadow>
                <boxGeometry args={[wineWidth, topHeight, thickness]} />
                <meshStandardMaterial color={color} />
            </mesh>
            {/* Bottom */}
            <mesh position={[0, -height / 2 + bottomHeight / 2, 0]} receiveShadow castShadow>
                <boxGeometry args={[wineWidth, bottomHeight, thickness]} />
                <meshStandardMaterial color={color} />
            </mesh>
        </group>
    )
}

export function Experience({ isMobile }: ExperienceProps) {
    const { camera } = useThree()
    const [sub, get] = useKeyboardControls()
    const controlsRef = useRef<any>(null)

    const velocity = useRef(new THREE.Vector3())
    const direction = useRef(new THREE.Vector3())
    const lastTime = useRef(performance.now())

    useFrame(() => {
        if (isMobile) return

        const time = performance.now()
        const delta = (time - lastTime.current) / 1000
        const safeDelta = Math.min(delta, 0.1)

        const { forward, backward, left, right, run } = get()

        velocity.current.x -= velocity.current.x * 10.0 * safeDelta
        velocity.current.z -= velocity.current.z * 10.0 * safeDelta

        direction.current.z = Number(forward) - Number(backward)
        direction.current.x = Number(left) - Number(right)
        direction.current.normalize()

        if (forward || backward) velocity.current.z -= direction.current.z * 400.0 * safeDelta * (run ? 2 : 1)
        if (left || right) velocity.current.x -= direction.current.x * 400.0 * safeDelta * (run ? 2 : 1)

        if (controlsRef.current?.isLocked) {
            controlsRef.current.moveRight(-velocity.current.x * safeDelta * 0.05)
            controlsRef.current.moveForward(-velocity.current.z * safeDelta * 0.05)
        }

        lastTime.current = time
    })

    const handleClick = () => {
        if (!isMobile && controlsRef.current) {
            controlsRef.current.lock();
        }
    }

    useEffect(() => {
        camera.position.set(0, 1.6, roomConfig.depth / 2 - 2)
    }, [])

    const { width, depth, height, walls, floor, window: winConfig } = roomConfig

    return (
        <>
            {isMobile ? (
                <OrbitControls makeDefault target={[0, 1, 0]} />
            ) : (
                <PointerLockControls ref={controlsRef} />
            )}

            <ambientLight intensity={0.4} />
            <pointLight position={[0, height - 0.5, 0]} intensity={0.8} castShadow shadow-bias={-0.001} />
            <Environment preset="apartment" />

            <group onClick={handleClick}>
                {/* Floor */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                    <planeGeometry args={[width, depth]} />
                    <meshStandardMaterial color={floor.color} />
                </mesh>

                {/* Walls Construction */}

                {/* Back Wall (North) - Negative Z */}
                <group position={[0, height / 2, -depth / 2]}>
                    {winConfig.wall === 'back' ? (
                        <WallWithWindow
                            width={width}
                            height={height}
                            thickness={walls.thickness}
                            windowConfig={winConfig}
                            color={walls.color}
                        />
                    ) : (
                        <mesh position={[0, 0, 0]} receiveShadow castShadow>
                            <boxGeometry args={[width, height, walls.thickness]} />
                            <meshStandardMaterial color={walls.color} />
                        </mesh>
                    )}
                </group>

                {/* Front Wall (South) - Positive Z */}
                <group position={[0, height / 2, depth / 2]}>
                    <mesh position={[0, 0, 0]} receiveShadow castShadow>
                        <boxGeometry args={[width, height, walls.thickness]} />
                        <meshStandardMaterial color={walls.color} />
                    </mesh>
                </group>

                {/* Left Wall (West) - Negative X */}
                <group position={[-width / 2, height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <mesh position={[0, 0, 0]} receiveShadow castShadow>
                        <boxGeometry args={[depth, height, walls.thickness]} />
                        <meshStandardMaterial color="#d4d4d4" />
                    </mesh>
                </group>

                {/* Right Wall (East) - Positive X */}
                <group position={[width / 2, height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <mesh position={[0, 0, 0]} receiveShadow castShadow>
                        <boxGeometry args={[depth, height, walls.thickness]} />
                        <meshStandardMaterial color="#d4d4d4" />
                    </mesh>
                </group>

                {/* Furniture Placeholders (kept for reference, adjusted positions slightly) */}
                <group position={[-width / 4, 0.3, -depth / 4]}>
                    <mesh castShadow receiveShadow>
                        <boxGeometry args={[2.5, 0.6, 4]} />
                        <meshStandardMaterial color="#3b82f6" />
                    </mesh>
                </group>

            </group>
        </>
    )
}
