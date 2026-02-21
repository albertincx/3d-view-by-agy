import {useEffect, useRef} from 'react'
import {useFrame, useThree} from '@react-three/fiber'
import {OrbitControls, PointerLockControls, useKeyboardControls, Text} from '@react-three/drei'
import * as THREE from 'three'

interface ExperienceProps {
    isMobile: boolean
    config: any
    mobileInput: { x: number; y: number }
    mobileKeys: { forward: number; backward: number; left: number; right: number }
}

const WallSegment = ({segment}: { segment: any }) => {
    const {start, end, thickness, height, color} = segment

    // Create vector instances
    const s = new THREE.Vector3(start[0], height / 2, start[1])
    const e = new THREE.Vector3(end[0], height / 2, end[1])

    // Calculate length
    const length = s.distanceTo(e)

    // Calculate center position
    const position = s.clone().add(e).multiplyScalar(0.5)

    // Calculate rotation (Y-axis)
    const angle = Math.atan2(e.z - s.z, e.x - s.x)

    // Calculate wall area (length × height)
    const area = (length * height).toFixed(2)

    return (
        <>
            <mesh position={position} rotation={[0, -angle, 0]} castShadow receiveShadow>
                <boxGeometry args={[length, height, thickness]}/>
                <meshStandardMaterial color={color}/>
            </mesh>
            {/* Wall area label */}
            <Text
                position={[position.x, position.y, position.z + 0.01]}
                rotation={[0, -angle, 0]}
                fontSize={0.15}
                color="#000000"
                anchorX="center"
                anchorY="middle"
            >
                {area} m²
            </Text>
        </>
    )
}

const Table = ({table}: { table: any }) => {
    const {position, width, depth, height, color} = table

    return (
        <group position={[position[0], height / 2, position[1]]}>
            {/* Tabletop */}
            <mesh position={[0, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[width, 0.05, depth]}/>
                <meshStandardMaterial color={color || '#8B4513'}/>
            </mesh>
            {/* Legs */}
            {[
                [width / 2 - 0.03, -height / 2 + 0.025, depth / 2 - 0.03],
                [-width / 2 + 0.03, -height / 2 + 0.025, depth / 2 - 0.03],
                [width / 2 - 0.03, -height / 2 + 0.025, -depth / 2 + 0.03],
                [-width / 2 + 0.03, -height / 2 + 0.025, -depth / 2 + 0.03]
            ].map((legPos, i) => (
                <mesh key={i} position={legPos as [number, number, number]} castShadow>
                    <cylinderGeometry args={[0.02, 0.02, height - 0.05, 8]}/>
                    <meshStandardMaterial color={color || '#8B4513'}/>
                </mesh>
            ))}
        </group>
    )
}

export function Experience({isMobile, config, mobileInput, mobileKeys}: ExperienceProps) {
    const {camera} = useThree()
    const [sub, get] = useKeyboardControls()
    const controlsRef = useRef<any>(null)

    const velocity = useRef(new THREE.Vector3())
    const direction = useRef(new THREE.Vector3())
    const lastTime = useRef(performance.now())

    const {rooms, floor, tables} = config || {rooms: [], floor: {color: '#ccc'}, tables: []}
    const safeRooms = rooms || (config.segments ? [{position: [0, 0], segments: config.segments}] : [])
    const safeTables = tables || []

    useFrame(() => {
        const time = performance.now()
        const delta = (time - lastTime.current) / 1000
        const safeDelta = Math.min(delta, 0.1)

        if (isMobile) {
            // Use mobile controls (joystick + WASD buttons)
            const forward = mobileKeys.forward || (mobileInput.y > 0 ? 1 : 0)
            const backward = mobileKeys.backward || (mobileInput.y < 0 ? 1 : 0)
            const left = mobileKeys.left || (mobileInput.x < 0 ? 1 : 0)
            const right = mobileKeys.right || (mobileInput.x > 0 ? 1 : 0)

            // Calculate movement direction from joystick
            const moveX = mobileInput.x * Math.abs(mobileInput.y) + (mobileKeys.right - mobileKeys.left)
            const moveZ = mobileInput.y + (mobileKeys.forward - mobileKeys.backward)

            camera.position.x += moveX * 0.1
            camera.position.z += moveZ * 0.1
        } else {
            // Use keyboard controls (WASD)
            const {forward, backward, left, right, run} = get()
            
            velocity.current.x -= velocity.current.x * 10.0 * safeDelta
            velocity.current.z -= velocity.current.z * 10.0 * safeDelta

            direction.current.z = Number(forward) - Number(backward)
            direction.current.x = Number(right) - Number(left)
            direction.current.normalize()

            if (forward || backward) velocity.current.z -= direction.current.z * 400.0 * safeDelta * (run ? 2 : 1)
            if (left || right) velocity.current.x -= direction.current.x * 400.0 * safeDelta * (run ? 2 : 1)

            if (controlsRef.current?.isLocked) {
                controlsRef.current.moveRight(-velocity.current.x * safeDelta * 0.05)
                controlsRef.current.moveForward(-velocity.current.z * safeDelta * 0.05)
            } else {
                // Allow WASD movement even without pointer lock
                camera.position.x += -velocity.current.x * safeDelta * 0.05
                camera.position.z += -velocity.current.z * safeDelta * 0.05
            }
        }

        lastTime.current = time
    })

    useEffect(() => {
        // Start near the entrance (approx 1, 4)
        camera.position.set(1, 1.6, 4)
    }, [])

    return (
        <>
            {isMobile ? (
                <OrbitControls makeDefault target={[2, 1, 2]}/>
            ) : (
                <PointerLockControls ref={controlsRef}/>
            )}

            <ambientLight intensity={0.5}/>
            <directionalLight position={[10, 10, 5]} intensity={1} castShadow/>

            <group>
                {/* Floor */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[5, -0.01, 5]} receiveShadow>
                    <planeGeometry args={[40, 40]}/>
                    <meshStandardMaterial color={floor?.color || '#e5e5e5'}/>
                </mesh>

                <gridHelper args={[40, 40]} position={[5, 0, 5]}/>

                {/* Rooms */}
                {safeRooms.map((room: any, roomIndex: number) => (
                    <group key={room.id || roomIndex} position={[room.position[0], 0, room.position[1]]}>
                        {room.segments.map((segment: any, i: number) => (
                            <WallSegment key={i} segment={segment}/>
                        ))}
                    </group>
                ))}

                {/* Tables */}
                {safeTables.map((table: any, i: number) => (
                    <Table key={i} table={table}/>
                ))}
            </group>
        </>
    )
}
