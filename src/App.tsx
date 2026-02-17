import { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { KeyboardControls, useKeyboardControls } from '@react-three/drei'
import { Experience } from './Experience'
import { Sidebar } from './Sidebar'
import { Suspense } from 'react'
import initialRoomConfig from './room.json'

export default function App() {
    const [isMobile, setIsMobile] = useState(false)
    const [config, setConfig] = useState(initialRoomConfig)

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.matchMedia('(max-width: 768px)').matches || 'ontouchstart' in window)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const keyboardMap = [
        { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
        { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
        { name: 'left', keys: ['ArrowLeft', 'a', 'A'] },
        { name: 'right', keys: ['ArrowRight', 'd', 'D'] },
        { name: 'jump', keys: ['Space'] },
        { name: 'run', keys: ['Shift'] },
    ]

    return (
        <div className="h-screen w-screen bg-neutral-900 text-white overflow-hidden relative flex">
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <h1 className="text-2xl font-bold bg-black/50 p-2 rounded backdrop-blur-sm">
                    3D Viewer
                </h1>
                <p className="text-sm opacity-70 mt-1 bg-black/50 p-2 rounded backdrop-blur-sm">
                    {isMobile ? 'Touch to zoom/pan' : 'WASD to walk, Mouse to look'}
                </p>
            </div>

            <Sidebar config={config} setConfig={setConfig} />

            <Canvas shadows camera={{ position: [0, 2, 5], fov: 50 }}>
                <color attach="background" args={['#171717']} />
                <KeyboardControls map={keyboardMap}>
                    <Suspense fallback={null}>
                        <Experience isMobile={isMobile} config={config} />
                    </Suspense>
                </KeyboardControls>
            </Canvas>
        </div>
    )
}
