import { useState, useRef, useEffect } from 'react'

interface JoystickProps {
    x: number
    z: number
    onChange: (x: number, z: number) => void
}

export function Joystick({ x, z, onChange }: JoystickProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [dragging, setDragging] = useState(false)

    // Scale factor: 1px = 0.1 meter (approx) or similar
    // We'll use a fixed range for the joystick visual, mapping to the room position
    const range = 20 // +/- 20 meters
    const size = 100 // 100px width/height

    const handlePointerDown = (e: React.PointerEvent) => {
        setDragging(true);
        (e.target as Element).setPointerCapture(e.pointerId)
    }

    const handlePointerUp = (e: React.PointerEvent) => {
        setDragging(false);
        (e.target as Element).releasePointerCapture(e.pointerId)
    }

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!dragging || !containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2

        // Calculate delta from center
        let deltaX = e.clientX - centerX
        let deltaY = e.clientY - centerY

        // Clamp to visual bounds (radius)
        const maxDist = size / 2
        const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
        if (dist > maxDist) {
            const angle = Math.atan2(deltaY, deltaX)
            deltaX = Math.cos(angle) * maxDist
            deltaY = Math.sin(angle) * maxDist
        }

        // Map delta (pixels) to world coordinates (meters)
        // Let's say full width (100px) = 40 meters (+/- 20)
        // So 50px = 20m -> 1px = 0.4m
        const scale = range / (size / 2)
        const newX = deltaX * scale
        const newZ = deltaY * scale

        onChange(newX, newZ)
    }

    // Calculate handle position from props
    // Map world coords (meters) to pixels
    const scale = (size / 2) / range
    const handleX = Math.max(-size / 2, Math.min(size / 2, x * scale))
    const handleY = Math.max(-size / 2, Math.min(size / 2, z * scale))

    return (
        <div className="flex flex-col items-center gap-2">
            <div
                ref={containerRef}
                className="relative w-[100px] h-[100px] bg-gray-800 rounded-full border border-gray-600 touch-none cursor-move"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            >
                {/* Grid lines */}
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gray-700 pointer-events-none" />
                <div className="absolute top-0 left-1/2 w-[1px] h-full bg-gray-700 pointer-events-none" />

                {/* Handle */}
                <div
                    className="absolute w-4 h-4 bg-blue-500 rounded-full shadow-lg border border-white transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{
                        left: `${50 + handleX}px`,
                        top: `${50 + handleY}px`
                    }}
                />
            </div>
            <div className="text-[10px] text-gray-400 font-mono">
                X: {x.toFixed(1)} Z: {z.toFixed(1)}
            </div>
        </div>
    )
}
