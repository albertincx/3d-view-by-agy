import { useState, useEffect } from 'react'

interface SidebarProps {
    config: any
    setConfig: (config: any) => void
}

export function Sidebar({ config, setConfig }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(true)
    const [activeTab, setActiveTab] = useState<'ui' | 'json'>('ui')
    const [jsonText, setJsonText] = useState(JSON.stringify(config, null, 2))
    const [error, setError] = useState<string | null>(null)
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

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

    const updateSegment = (index: number, field: string, value: any) => {
        const newSegments = [...config.segments]
        // Handle nested updates for start/end arrays or direct properties
        if (field.includes('.')) {
            const [parent, childIndex] = field.split('.')
            newSegments[index][parent][parseInt(childIndex)] = parseFloat(value)
        } else {
            newSegments[index][field] = value
        }
        setConfig({ ...config, segments: newSegments })
    }

    const exportJson = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "room.json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
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
        <div className="absolute top-0 right-0 h-full w-96 bg-gray-900 border-l border-gray-700 z-50 flex flex-col shadow-xl overflow-hidden">
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
                                    value={config.floor.color}
                                    onChange={(e) => updateFloorColor(e.target.value)}
                                    className="bg-transparent border-none w-8 h-8 cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Wall Segments */}
                        <div className="space-y-4">
                            <h3 className="text-xs uppercase font-bold text-gray-500 tracking-wider">Walls ({config.segments.length})</h3>
                            {config.segments.map((segment: any, i: number) => (
                                <div key={i} className="bg-gray-800 rounded border border-gray-700 overflow-hidden">
                                    <button
                                        className="w-full p-3 flex justify-between items-center text-left bg-gray-800 hover:bg-gray-750"
                                        onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                                    >
                                        <span className="text-xs font-bold text-gray-400">Wall #{i + 1}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded-full border border-gray-600" style={{ backgroundColor: segment.color }} />
                                            <span className="text-gray-500 text-xs">{expandedIndex === i ? '▲' : '▼'}</span>
                                        </div>
                                    </button>

                                    {expandedIndex === i && (
                                        <div className="p-3 border-t border-gray-700 space-y-4 bg-gray-900/50">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[10px] text-gray-500">Color</label>
                                                <input
                                                    type="color"
                                                    value={segment.color}
                                                    onChange={(e) => updateSegment(i, 'color', e.target.value)}
                                                    className="bg-transparent border-none w-6 h-6 cursor-pointer"
                                                />
                                            </div>

                                            <div className="space-y-3">
                                                <div>
                                                    <div className="flex justify-between mb-1">
                                                        <label className="text-[10px] text-gray-500">Start X</label>
                                                        <span className="text-[10px] text-gray-400">{segment.start[0]}</span>
                                                    </div>
                                                    <div className="flex gap-2 items-center">
                                                        <input
                                                            type="range" min="-10" max="20" step="0.1"
                                                            value={segment.start[0]}
                                                            onChange={(e) => updateSegment(i, 'start.0', e.target.value)}
                                                            className="flex-1"
                                                        />
                                                        <input
                                                            type="number" step="0.1"
                                                            value={segment.start[0]}
                                                            onChange={(e) => updateSegment(i, 'start.0', e.target.value)}
                                                            className="w-12 bg-gray-900 border border-gray-600 rounded px-1 py-0.5 text-[10px] text-white text-right"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="flex justify-between mb-1">
                                                        <label className="text-[10px] text-gray-500">Start Z</label>
                                                        <span className="text-[10px] text-gray-400">{segment.start[1]}</span>
                                                    </div>
                                                    <div className="flex gap-2 items-center">
                                                        <input
                                                            type="range" min="-10" max="20" step="0.1"
                                                            value={segment.start[1]}
                                                            onChange={(e) => updateSegment(i, 'start.1', e.target.value)}
                                                            className="flex-1"
                                                        />
                                                        <input
                                                            type="number" step="0.1"
                                                            value={segment.start[1]}
                                                            onChange={(e) => updateSegment(i, 'start.1', e.target.value)}
                                                            className="w-12 bg-gray-900 border border-gray-600 rounded px-1 py-0.5 text-[10px] text-white text-right"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="flex justify-between mb-1">
                                                        <label className="text-[10px] text-gray-500">End X</label>
                                                        <span className="text-[10px] text-gray-400">{segment.end[0]}</span>
                                                    </div>
                                                    <div className="flex gap-2 items-center">
                                                        <input
                                                            type="range" min="-10" max="20" step="0.1"
                                                            value={segment.end[0]}
                                                            onChange={(e) => updateSegment(i, 'end.0', e.target.value)}
                                                            className="flex-1"
                                                        />
                                                        <input
                                                            type="number" step="0.1"
                                                            value={segment.end[0]}
                                                            onChange={(e) => updateSegment(i, 'end.0', e.target.value)}
                                                            className="w-12 bg-gray-900 border border-gray-600 rounded px-1 py-0.5 text-[10px] text-white text-right"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="flex justify-between mb-1">
                                                        <label className="text-[10px] text-gray-500">End Z</label>
                                                        <span className="text-[10px] text-gray-400">{segment.end[1]}</span>
                                                    </div>
                                                    <div className="flex gap-2 items-center">
                                                        <input
                                                            type="range" min="-10" max="20" step="0.1"
                                                            value={segment.end[1]}
                                                            onChange={(e) => updateSegment(i, 'end.1', e.target.value)}
                                                            className="flex-1"
                                                        />
                                                        <input
                                                            type="number" step="0.1"
                                                            value={segment.end[1]}
                                                            onChange={(e) => updateSegment(i, 'end.1', e.target.value)}
                                                            className="w-12 bg-gray-900 border border-gray-600 rounded px-1 py-0.5 text-[10px] text-white text-right"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="flex justify-between mb-1">
                                                        <label className="text-[10px] text-gray-500">Height</label>
                                                        <span className="text-[10px] text-gray-400">{segment.height}m</span>
                                                    </div>
                                                    <input
                                                        type="range" min="0.5" max="5" step="0.1"
                                                        value={segment.height}
                                                        onChange={(e) => updateSegment(i, 'height', parseFloat(e.target.value))}
                                                        className="w-full"
                                                    />
                                                </div>
                                            </div>
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
