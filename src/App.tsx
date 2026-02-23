import {Suspense, useCallback, useEffect, useRef, useState} from 'react'
import {Canvas} from '@react-three/fiber'
import {KeyboardControls} from '@react-three/drei'
import {Experience} from './Experience'
import {Sidebar} from './Sidebar'
import initialRoomConfig from './room.json'
import initialRoomConfig2 from './room_b.json'

// Virtual joystick for mobile
function Joystick({onMove}: { onMove: (x: number, y: number) => void }) {
    const joystickRef = useRef<HTMLDivElement>(null)
    const [active, setActive] = useState(false)
    const [position, setPosition] = useState({x: 0, y: 0})
    const centerRef = useRef({x: 0, y: 0})
    const maxRadius = 50

    const handleStart = useCallback((clientX: number, clientY: number) => {
        setActive(true)
        if (joystickRef.current) {
            const rect = joystickRef.current.getBoundingClientRect()
            centerRef.current = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            }
            handleMove(clientX, clientY)
        }
    }, [])

    const handleMove = useCallback((clientX: number, clientY: number) => {
        if (!active) return

        const dx = clientX - centerRef.current.x
        const dy = clientY - centerRef.current.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const angle = Math.atan2(dy, dx)

        const clampedDistance = Math.min(distance, maxRadius)
        const newX = Math.cos(angle) * clampedDistance
        const newY = Math.sin(angle) * clampedDistance

        setPosition({x: newX, y: newY})
        onMove(newX / maxRadius, -newY / maxRadius)
    }, [active, onMove])

    const handleEnd = useCallback(() => {
        setActive(false)
        setPosition({x: 0, y: 0})
        onMove(0, 0)
    }, [onMove])

    useEffect(() => {
        const handleTouchMove = (e: TouchEvent) => {
            if (active && e.touches[0]) {
                e.preventDefault()
                handleMove(e.touches[0].clientX, e.touches[0].clientY)
            }
        }
        const handleTouchEnd = () => handleEnd()

        document.addEventListener('touchmove', handleTouchMove, {passive: false})
        document.addEventListener('touchend', handleTouchEnd)

        return () => {
            document.removeEventListener('touchmove', handleTouchMove)
            document.removeEventListener('touchend', handleTouchEnd)
        }
    }, [active, handleMove, handleEnd])

    return (
        <div
            ref={joystickRef}
            className="absolute left-8 w-28 h-28 bg-white/20 rounded-full backdrop-blur-sm touch-none"
            style={{bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))'}}
            onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
        >
            <div
                className="absolute w-12 h-12 bg-white/60 rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{
                    transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`
                }}
            />
        </div>
    )
}

// WASD buttons for mobile
function MobileWASD({
                        onKeyPress
                    }: {
    onKeyPress: (forward: number, backward: number, left: number, right: number) => void
}) {
    const [keys, setKeys] = useState({forward: false, backward: false, left: false, right: false})

    const updateKeys = useCallback((key: string, pressed: boolean) => {
        setKeys(prev => {
            const newKeys = {...prev, [key]: pressed}
            onKeyPress(
                newKeys.forward ? 1 : 0,
                newKeys.backward ? 1 : 0,
                newKeys.left ? 1 : 0,
                newKeys.right ? 1 : 0
            )
            return newKeys
        })
    }, [onKeyPress])

    const buttonClass = "w-14 h-14 bg-white/30 backdrop-blur-sm rounded-lg flex items-center justify-center text-white font-bold text-xl active:bg-white/50 select-none touch-none"

    return (
        <div className="absolute right-8 flex flex-col gap-2"
             style={{bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))'}}>
            <div className="flex justify-center">
                <button
                    className={buttonClass}
                    onTouchStart={() => updateKeys('forward', true)}
                    onTouchEnd={() => updateKeys('forward', false)}
                >
                    ↑
                </button>
            </div>
            <div className="flex gap-2">
                <button
                    className={buttonClass}
                    onTouchStart={() => updateKeys('left', true)}
                    onTouchEnd={() => updateKeys('left', false)}
                >
                    ←
                </button>
                <button
                    className={buttonClass}
                    onTouchStart={() => updateKeys('backward', true)}
                    onTouchEnd={() => updateKeys('backward', false)}
                >
                    ↓
                </button>
                <button
                    className={buttonClass}
                    onTouchStart={() => updateKeys('right', true)}
                    onTouchEnd={() => updateKeys('right', false)}
                >
                    →
                </button>
            </div>
        </div>
    )
}

export default function App() {
    const [isMobile, setIsMobile] = useState(false)
    const mergedInitialConfig = (() => {
        const config1 = initialRoomConfig as any
        const config2 = initialRoomConfig2 as any

        let maxX = 0
        config1.rooms.forEach((room: any) => {
            room.segments.forEach((seg: any) => {
                maxX = Math.max(maxX, seg.start[0] + room.position[0], seg.end[0] + room.position[0])
            })
        })
        const offset = maxX + 5
        const batchId = `batch-initial-b`

        const shiftedRooms2 = (config2.rooms || []).map((room: any) => ({
            ...room,
            id: `${room.id}-b`,
            position: [room.position[0] + offset, room.position[1]],
            batchId
        }))

        const shiftedTables2 = (config2.tables || []).map((table: any) => ({
            ...table,
            id: `${table.id}-b`,
            position: [table.position[0] + offset, table.position[1]],
            batchId
        }))

        return {
            ...config1,
            rooms: [...config1.rooms, ...shiftedRooms2],
            tables: [...(config1.tables || []), ...shiftedTables2]
        }
    })()

    const [config, setConfig] = useState(mergedInitialConfig)
    const [mobileInput, setMobileInput] = useState({x: 0, y: 0})
    const [mobileKeys, setMobileKeys] = useState({forward: 0, backward: 0, left: 0, right: 0})
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const canvasRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.matchMedia('(max-width: 768px)').matches || 'ontouchstart' in window)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    useEffect(() => {
        // Focus canvas for keyboard controls
        if (canvasRef.current && !isMobile) {
            canvasRef.current.focus()
        }
    }, [isMobile])

    const keyboardMap = [
        {name: 'forward', keys: ['ArrowUp', 'w', 'W']},
        {name: 'backward', keys: ['ArrowDown', 's', 'S']},
        {name: 'left', keys: ['ArrowLeft', 'a', 'A']},
        {name: 'right', keys: ['ArrowRight', 'd', 'D']},
        {name: 'jump', keys: ['Space']},
        {name: 'run', keys: ['Shift']},
    ]

    return (
        <div className="h-screen w-screen bg-neutral-900 text-white overflow-hidden relative flex">
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <h1 className="text-2xl font-bold bg-black/50 p-2 rounded backdrop-blur-sm">
                    3D Viewer
                </h1>
                <p className="text-sm opacity-70 mt-1 bg-black/50 p-2 rounded backdrop-blur-sm">
                    {isMobile ? 'Use joystick or WASD to move' : 'WASD to walk, Mouse to look'}
                </p>
            </div>

            <Sidebar config={config} setConfig={setConfig} isOpen={sidebarOpen} setIsOpen={setSidebarOpen}/>

            <div ref={canvasRef} className="flex-1" tabIndex={-1}>
                <Canvas shadows camera={{position: [0, 2, 5], fov: 50}} tabIndex={1} style={{outline: 'none'}}
                        autoFocus>
                    <color attach="background" args={['#171717']}/>
                    <KeyboardControls map={keyboardMap}>
                        <Suspense fallback={null}>
                            <Experience
                                isMobile={isMobile}
                                config={config}
                                mobileInput={mobileInput}
                                mobileKeys={mobileKeys}
                                sidebarOpen={sidebarOpen}
                            />
                        </Suspense>
                    </KeyboardControls>
                </Canvas>
            </div>

            {/* Mobile controls */}
            {isMobile && (
                <>
                    <Joystick onMove={(x, y) => setMobileInput({x, y})}/>
                    <MobileWASD
                        onKeyPress={(f, b, l, r) => setMobileKeys({forward: f, backward: b, left: l, right: r})}/>
                </>
            )}
        </div>
    )
}
