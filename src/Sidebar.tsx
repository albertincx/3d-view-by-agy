import { useState, useEffect } from 'react'
import { Joystick } from './components/Joystick'

interface SidebarProps {
    config: any
    setConfig: (config: any) => void
}

export function Sidebar({ config, setConfig }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(true)
    const [activeTab, setActiveTab] = useState<'ui' | 'json'>('ui')
    const [jsonText, setJsonText] = useState(JSON.stringify(config, null, 2))
    const [error, setError] = useState<string | null>(null)
    const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null)
    const [expandedSegmentIndex, setExpandedSegmentIndex] = useState<string | null>(null) // format: "roomId-segmentIndex"

    // Ensure config has rooms (migration for old state)
    useEffect(() => {
        if (!config.rooms && config.segments) {
            setConfig({
                ...config,
                rooms: [{ id: 'room-1', name: 'Main Room', position: [0, 0], segments: config.segments }],
                segments: undefined
            })
        }
    }, [config])

    const rooms = config.rooms || []

    useEffect(() => {
        if (activeTab === 'json') {
            setJsonText(JSON.stringify(config, null, 2))
        }
    }, [config, activeTab])

    const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value
        setJsonText(newValue)
        try {
            const parsed = JSON.parse(newValue)
            setConfig(parsed)
            setError(null)
        } catch (err: any) {
            setError(err.message)
        }
    }

    const updateFloorColor = (color: string) => {
        setConfig({ ...config, floor: { ...config.floor, color } })
    }

    const addRoom = () => {
        const newRoom = {
            id: `room-${Date.now()}`,
            name: `Room ${rooms.length + 1}`,
            position: [0, 0],
            segments: [
                { start: [0, 0], end: [3, 0], thickness: 0.2, height: 3, color: '#cccccc' },
                { start: [3, 0], end: [3, 3], thickness: 0.2, height: 3, color: '#cccccc' },
                { start: [3, 3], end: [0, 3], thickness: 0.2, height: 3, color: '#cccccc' },
                { start: [0, 3], end: [0, 0], thickness: 0.2, height: 3, color: '#cccccc' }
            ]
        }
        setConfig({ ...config, rooms: [...rooms, newRoom] })
        setExpandedRoomId(newRoom.id)
    }

    const updateRoomPosition = (roomIndex: number, x: number, z: number) => {
        const newRooms = [...rooms]
        newRooms[roomIndex].position = [x, z]
        setConfig({ ...config, rooms: newRooms })
    }

    const updateSegment = (roomIndex: number, segmentIndex: number, field: string, value: any) => {
        const newRooms = [...rooms]
        const newSegments = [...newRooms[roomIndex].segments]

        if (field.includes('.')) {
            const [parent, childIndex] = field.split('.')
            newSegments[segmentIndex][parent][parseInt(childIndex)] = parseFloat(value)
        } else {
            newSegments[segmentIndex][field] = value
        }

        newRooms[roomIndex].segments = newSegments
        setConfig({ ...config, rooms: newRooms })
    }

    const exportJson = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "room.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="absolute top-4 right-4 z-50 bg-black/50 text-white p-2 rounded hover:bg-black/70"
            >
                Edit Room
            </button>
        )
    }

    return (
        <div
            className="absolute top-0 right-0 h-full w-96 bg-gray-900 border-l border-gray-700 z-50 flex flex-col shadow-xl overflow-hidden"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
        >
            <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800">
                <h2 className="text-white font-bold">Room Editor</h2>
                <div className="flex gap-2">
                    <button onClick={exportJson} className="bg-blue-600 hover:bg-blue-700 text-xs px-2 py-1 rounded text-white">
                        Export
                    </button>
                    <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                        ✕
                    </button>
                </div>
            </div>

            <div className="flex border-b border-gray-700">
                <button
                    className={`flex-1 p-2 text-sm ${activeTab === 'ui' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
                    onClick={() => setActiveTab('ui')}
                >
                    Controls
                </button>
                <button
                    className={`flex-1 p-2 text-sm ${activeTab === 'json' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
                    onClick={() => setActiveTab('json')}
                >
                    Raw JSON
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {activeTab === 'json' ? (
                    <div className="h-full flex flex-col">
                        <textarea
                            className="flex-1 bg-[#1e1e1e] text-[#d4d4d4] p-4 font-mono text-xs resize-none focus:outline-none"
                            value={jsonText}
                            onChange={handleJsonChange}
                            spellCheck={false}
                        />
                        {error && (
                            <div className="p-2 bg-red-900/50 border-t border-red-700 text-red-200 text-xs">
                                {error}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-4 space-y-6">
                        {/* Global Settings */}
                        <div className="space-y-4">
                            <h3 className="text-xs uppercase font-bold text-gray-500 tracking-wider">Global Settings</h3>
                            <div className="flex items-center justify-between">
                                <label className="text-sm text-gray-300">Floor Color</label>
                                <input
                                    type="color"
                                    value={config.floor?.color || '#ffffff'}
                                    onChange={(e) => updateFloorColor(e.target.value)}
                                    className="bg-transparent border-none w-8 h-8 cursor-pointer"
                                />
                            </div>
                            <button
                                onClick={addRoom}
                                className="w-full bg-green-600 hover:bg-green-700 text-white text-xs py-2 rounded font-bold"
                            >
                                + Add Room
                            </button>
                        </div>

                        {/* Rooms List */}
                        <div className="space-y-4">
                            <h3 className="text-xs uppercase font-bold text-gray-500 tracking-wider">Rooms ({rooms.length})</h3>
                            {rooms.map((room: any, roomIndex: number) => (
                                <div key={room.id || roomIndex} className="bg-gray-800 rounded border border-gray-700 overflow-hidden">
                                    <button
                                        className="w-full p-3 flex justify-between items-center text-left bg-gray-800 hover:bg-gray-750 border-b border-gray-700"
                                        onClick={() => setExpandedRoomId(expandedRoomId === room.id ? null : room.id)}
                                    >
                                        <span className="text-sm font-bold text-gray-200">{room.name || `Room ${roomIndex + 1}`}</span>
                                        <span className="text-gray-500 text-xs">{expandedRoomId === room.id ? '▲' : '▼'}</span>
                                    </button>

                                    {expandedRoomId === room.id && (
                                        <div className="p-3 bg-gray-900/30 space-y-4">
                                            {/* Joystick Control */}
                                            <div className="flex justify-center py-2 border-b border-gray-700 mb-2">
                                                <Joystick
                                                    x={room.position[0]}
                                                    z={room.position[1]}
                                                    onChange={(x, z) => updateRoomPosition(roomIndex, x, z)}
                                                />
                                            </div>

                                            <h4 className="text-xs font-bold text-gray-500">Walls</h4>
                                            {room.segments.map((segment: any, i: number) => {
                                                const segmentId = `${room.id}-${i}`
                                                const isExpanded = expandedSegmentIndex === segmentId

                                                return (
                                                    <div key={i} className="bg-gray-800 rounded border border-gray-700 overflow-hidden">
                                                        <button
                                                            className="w-full p-2 flex justify-between items-center text-left bg-gray-800 hover:bg-gray-750"
                                                            onClick={() => setExpandedSegmentIndex(isExpanded ? null : segmentId)}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-bold text-gray-400">Wall #{i + 1}</span>
                                                                <div className="w-3 h-3 rounded-full border border-gray-600" style={{ backgroundColor: segment.color }} />
                                                            </div>
                                                            <span className="text-gray-500 text-[10px]">{isExpanded ? '▲' : '▼'}</span>
                                                        </button>

                                                        {isExpanded && (
                                                            <div className="p-2 border-t border-gray-700 space-y-3 bg-gray-900/50">
                                                                <div className="flex justify-between items-center">
                                                                    <label className="text-[10px] text-gray-500">Color</label>
                                                                    <input
                                                                        type="color"
                                                                        value={segment.color}
                                                                        onChange={(e) => updateSegment(roomIndex, i, 'color', e.target.value)}
                                                                        className="bg-transparent border-none w-6 h-6 cursor-pointer"
                                                                    />
                                                                </div>

                                                                <div className="space-y-2">
                                                                    {['Start X', 'Start Z', 'End X', 'End Z'].map((label, idx) => {
                                                                        const field = idx < 2 ? `start.${idx}` : `end.${idx - 2}`
                                                                        const val = idx < 2 ? segment.start[idx] : segment.end[idx - 2]
                                                                        return (
                                                                            <div key={label}>
                                                                                <div className="flex justify-between mb-1">
                                                                                    <label className="text-[10px] text-gray-500">{label}</label>
                                                                                    <span className="text-[10px] text-gray-400">{val.toFixed(1)}</span>
                                                                                </div>
                                                                                <div className="flex gap-2 items-center">
                                                                                    <input
                                                                                        type="range" min="-10" max="20" step="0.1"
                                                                                        value={val}
                                                                                        onChange={(e) => updateSegment(roomIndex, i, field, e.target.value)}
                                                                                        className="flex-1"
                                                                                    />
                                                                                    <input
                                                                                        type="number" step="0.1"
                                                                                        value={val}
                                                                                        onChange={(e) => updateSegment(roomIndex, i, field, e.target.value)}
                                                                                        className="w-12 bg-gray-900 border border-gray-600 rounded px-1 py-0.5 text-[10px] text-white text-right"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
