# Room JSON Format Documentation

This document describes the structure of `room.json` file used to define the 3D apartment layout.

## Root Structure

```json
{
  "rooms": [...],
  "tables": [...],
  "floor": {...}
}
```

---

## Rooms Array

Each room contains walls (segments) that define the room shape.

```json
{
  "id": "room-1",
  "name": "Main Apartment",
  "position": [0, 0],
  "segments": [...]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (e.g., `"room-1"`) |
| `name` | string | Display name in the UI |
| `position` | `[x, z]` | Room offset in meters from origin |
| `segments` | array | Array of wall segments |

---

## Wall Segments

Each segment defines one wall piece.

```json
{
  "start": [0, 0],
  "end": [2.2, 0],
  "thickness": 0.2,
  "height": 3.0,
  "color": "#f0f0f0",
  "holes": []
}
```

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `start` | `[x, z]` | Wall start position (X, Z coordinates in meters) | `[0, 0]` |
| `end` | `[x, z]` | Wall end position (X, Z coordinates in meters) | `[2.2, 0]` |
| `thickness` | number | Wall thickness in meters | `0.2` |
| `height` | number | **Wall height in meters** (floor to ceiling) | `3.0` |
| `color` | string | Wall color (hex) | `"#f0f0f0"` |
| `holes` | array | Reserved for doors/windows (not implemented) | `[]` |

### Wall Area
The wall area displayed on each wall is calculated as:
```
Area = length × height (in m²)
```
Where `length` is the distance between `start` and `end` points.

---

## Tables Array

Furniture (tables) that can be placed in rooms.

```json
{
  "id": "table-1",
  "name": "Table 1",
  "position": [2, 2],
  "width": 1.2,
  "depth": 0.8,
  "height": 0.75,
  "color": "#8B4513"
}
```

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Unique identifier | `"table-1"` |
| `name` | string | Display name in the UI | `"Table 1"` |
| `position` | `[x, z]` | Table center position (X, Z in meters) | `[2, 2]` |
| `width` | number | Table width in meters | `1.2` |
| `depth` | number | Table depth in meters | `0.8` |
| `height` | number | **Table height in meters** (from floor) | `0.75` |
| `color` | string | Table color (hex) | `"#8B4513"` |

---

## Floor Object

```json
{
  "width": 10,
  "depth": 10,
  "color": "#e5e5e5"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `width` | number | Floor width in meters |
| `depth` | number | Floor depth in meters |
| `color` | string | Floor color (hex) |

---

## Example: Complete room.json

```json
{
  "rooms": [
    {
      "id": "room-1",
      "name": "Living Room",
      "position": [0, 0],
      "segments": [
        {
          "start": [0, 0],
          "end": [4, 0],
          "thickness": 0.2,
          "height": 3.0,
          "color": "#f0f0f0"
        },
        {
          "start": [4, 0],
          "end": [4, 3],
          "thickness": 0.2,
          "height": 3.0,
          "color": "#f0f0f0"
        },
        {
          "start": [4, 3],
          "end": [0, 3],
          "thickness": 0.2,
          "height": 3.0,
          "color": "#f0f0f0"
        },
        {
          "start": [0, 3],
          "end": [0, 0],
          "thickness": 0.2,
          "height": 3.0,
          "color": "#f0f0f0"
        }
      ]
    }
  ],
  "tables": [
    {
      "id": "table-1",
      "name": "Coffee Table",
      "position": [2, 1.5],
      "width": 0.8,
      "depth": 0.6,
      "height": 0.45,
      "color": "#654321"
    }
  ],
  "floor": {
    "width": 10,
    "depth": 10,
    "color": "#e5e5e5"
  }
}
```

---

## Quick Reference

| Parameter | Meaning | Typical Values |
|-----------|---------|----------------|
| `height` (wall) | Ceiling height | `2.5` - `3.5` meters |
| `height` (table) | Table surface height | `0.45` (coffee) - `0.75` (dining) |
| `thickness` | Wall width | `0.15` - `0.3` meters |
| `position [x, z]` | Location on floor plan | `0` to `10` typical |

---

## Tips for Editing

1. **Wall coordinates**: `start` and `end` define a line on the XZ plane (top-down view)
2. **Positive X**: Right direction
3. **Positive Z**: Forward direction (into the screen)
4. **Wall labels**: Show area in m² (length × height)
5. **Use Export/Import**: Edit in UI, export to save; import to load
