# Project API Documentation

## Overview

This API manages projects and their layers for the Picnice image editor application.

## Models

### Project

- `id`: Integer (auto-generated)
- `name`: String (max 255 characters, optional)
- `width`: Integer (required)
- `height`: Integer (required)
- `created_at`: DateTime (auto-generated)
- `updated_at`: DateTime (auto-updated)
- `layers`: List of Layer objects (nested)

### Layer

- `id`: Integer (auto-generated)
- `layer_id`: String (frontend layer ID)
- `name`: String (max 255 characters)
- `objects_data`: JSON object (stores layer objects by ID)
- `object_orders`: JSON array (stores object IDs in order)
- `order`: Integer (layer order in project)
- `project`: Foreign key to Project
- `created_at`: DateTime (auto-generated)
- `updated_at`: DateTime (auto-updated)

## API Endpoints

### Projects

#### List Projects

```
GET /api/projects/
```

Returns a paginated list of projects with basic info and layer count.

#### Create Project

```
POST /api/projects/
Content-Type: application/json

{
  "name": "My Project",
  "width": 1920,
  "height": 1080,
  "layers": [
    {
      "layer_id": "layer-1",
      "name": "Background",
      "objects_data": {},
      "object_orders": [],
      "order": 0
    }
  ]
}
```

#### Get Project

```
GET /api/projects/{id}/
```

Returns full project details including all layers.

#### Update Project

```
PUT /api/projects/{id}/
Content-Type: application/json

{
  "name": "Updated Project",
  "width": 1920,
  "height": 1080,
  "layers": [...]
}
```

#### Partial Update Project

```
PATCH /api/projects/{id}/
Content-Type: application/json

{
  "name": "New Name"
}
```

#### Delete Project

```
DELETE /api/projects/{id}/
```

#### Get Project Layers

```
GET /api/projects/{id}/layers/
```

Returns all layers for a specific project.

#### Add Layer to Project

```
POST /api/projects/{id}/add_layer/
Content-Type: application/json

{
  "layer_id": "layer-2",
  "name": "New Layer",
  "objects_data": {},
  "object_orders": [],
  "order": 1
}
```

### Layers

#### List Layers

```
GET /api/layers/
```

Returns all layers across all projects.

#### Create Layer

```
POST /api/layers/
Content-Type: application/json

{
  "project": 1,
  "layer_id": "layer-3",
  "name": "New Layer",
  "objects_data": {},
  "object_orders": [],
  "order": 2
}
```

#### Get Layer

```
GET /api/layers/{id}/
```

#### Update Layer

```
PUT /api/layers/{id}/
Content-Type: application/json

{
  "layer_id": "layer-3",
  "name": "Updated Layer",
  "objects_data": {...},
  "object_orders": [...],
  "order": 2
}
```

#### Partial Update Layer

```
PATCH /api/layers/{id}/
Content-Type: application/json

{
  "name": "New Layer Name"
}
```

#### Delete Layer

```
DELETE /api/layers/{id}/
```

## Example Usage

### Creating a Project with Layers

```javascript
const project = {
  name: "My Design",
  width: 1920,
  height: 1080,
  layers: [
    {
      layer_id: "bg-layer",
      name: "Background",
      objects_data: {
        "rect-1": {
          id: "rect-1",
          type: "rectangle",
          frame: { x: 0, y: 0, width: 1920, height: 1080 },
          bgColor: { type: "solid", color: "#ffffff" },
        },
      },
      object_orders: ["rect-1"],
      order: 0,
    },
    {
      layer_id: "main-layer",
      name: "Main Content",
      objects_data: {},
      object_orders: [],
      order: 1,
    },
  ],
};

const response = await fetch("http://localhost:8000/api/projects/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(project),
});

const data = await response.json();
console.log("Created project:", data);
```

### Updating a Layer

```javascript
const layerId = 1;
const updatedLayer = {
  name: "Updated Layer",
  objects_data: {
    "image-1": {
      id: "image-1",
      type: "image",
      src: "...",
      frame: { x: 100, y: 100, width: 500, height: 500 },
    },
  },
  object_orders: ["image-1"],
};

const response = await fetch(`http://localhost:8000/api/layers/${layerId}/`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(updatedLayer),
});

const data = await response.json();
console.log("Updated layer:", data);
```

## Notes

- The `objects_data` field stores layer objects as a JSON object with object IDs as keys
- The `object_orders` field stores the order of objects in the layer as an array of IDs
- Layer objects support various types: image, rectangle, ellipse, freeform, path, arc, text, chalk, pen, pencil, highlighter, fountain-pen, watercolor
- All timestamps are in UTC
- CORS is configured to allow requests from `http://localhost:5173` (Vite dev server)
