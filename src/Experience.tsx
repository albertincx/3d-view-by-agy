import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PointerLockControls, useKeyboardControls } from '@react-three/drei'
import * as THREE from 'three'

interface ExperienceProps {
    isMobile: boolean
    config: any
}

const WallSegment = ({ segment }: { segment: any }) => {
    const { start, end, thickness, height, color } = segment

    // Create vector instances
    const s = new THREE.Vector3(start[0], height / 2, start[1])
    const e = new THREE.Vector3(end[0], height / 2, end[1])

    // Calculate length
    const length = s.distanceTo(e)

    // Calculate center position
    const position = s.clone().add(e).multiplyScalar(0.5)

    // Calculate rotation (Y-axis)
    const angle = Math.atan2(e.z - s.z, e.x - s.x)

    return (
        <mesh position={position} rotation={[0, -angle, 0]} castShadow receiveShadow>
            <boxGeometry args={[length, height, thickness]} />
            <meshStandardMaterial color={color} />
        </mesh>
    )
}

export function Experience({ isMobile, config }: ExperienceProps) {
    const { camera } = useThree()
    const [sub, get] = useKeyboardControls()
    const controlsRef = useRef<any>(null)

    const velocity = useRef(new THREE.Vector3())
    const direction = useRef(new THREE.Vector3())
    const lastTime = useRef(performance.now())

    const { rooms, floor } = config || { rooms: [], floor: { color: '#ccc' } }
    const safeRooms = rooms || (config.segments ? [{ position: [0, 0], segments: config.segments }] : [])

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
        // Start near the entrance (approx 1, 4)
        camera.position.set(1, 1.6, 4)
    }, [])

    return (
        <>
            {isMobile ? (
                <OrbitControls makeDefault target={[2, 1, 2]} />
            ) : (
                <PointerLockControls ref={controlsRef} />
            )}

            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

            <group onClick={handleClick}>
                {/* Floor */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[5, -0.01, 5]} receiveShadow>
                    <planeGeometry args={[40, 40]} />
                    <meshStandardMaterial color={floor?.color || '#e5e5e5'} />
                </mesh>

                <gridHelper args={[40, 40]} position={[5, 0, 5]} />

                {/* Rooms */}
                {safeRooms.map((room: any, roomIndex: number) => (
                    <group key={room.id || roomIndex} position={[room.position[0], 0, room.position[1]]}>
                        {room.segments.map((segment: any, i: number) => (
                            <WallSegment key={i} segment={segment} />
                        ))}
                    </group>
                ))}
            </group>
        </>
    )
}
