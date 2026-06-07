import {
  Ellipsis,
  Filter,
  Highlighter,
  Palette,
  Pen,
  Pencil,
  RectangleHorizontal,
  SlidersHorizontal,
  Sparkles,
  TypeIcon,
  TypeOutline,
} from "lucide-react";
import { Menu, MenuType, Tool } from "../types/tool-types";

export const MAIN_MENUS: Menu[] = [
  {
    menuType: "ai",
    icon: Sparkles,
    description: "AI Tools",
  },
  {
    menuType: "adjustments",
    icon: SlidersHorizontal,
    description: "Image Adjustments",
  },
  {
    menuType: "colors",
    icon: Palette,
    description: "Color Settings",
  },
  {
    menuType: "filters",
    icon: Filter,
    description: "Apply Filters",
  },
  {
    menuType: "text",
    icon: TypeOutline,
    description: "Insert Text",
  },
  {
    menuType: "shapes",
    icon: "Shapes",
    description: "Insert Shapes & Drawings",
  },
  {
    menuType: "draw",
    icon: "Freeform",
    description: "More",
  },
];

export const SHAPE_TOOLS: Tool[] = [
  {
    name: "Rectangle",
    icon: RectangleHorizontal,
    type: "rectangle",
    category: "shape",
    menuType: "shapes",
    params: [
      {
        name: "bgColor",
        type: "color",
        label: "Background",
      },
      {
        name: "lineColor",
        type: "color",
        label: "Border",
      },
      {
        name: "lineWidth",
        type: "count",
        min: 1,
        max: 100,
        step: 1,
        label: "Border Width",
        value: 1,
      },
      {
        name: "lineType",
        type: "select",
        label: "Line Type",
        options: ["Solid", "Dashed"],
        value: "Solid",
      },
      {
        name: "cornerRadius",
        type: "number",
        label: "Corner Radius",
        max: 100,
        min: 0,
        value: 0,
      },
      {
        name: "isSquare",
        type: "checkbox",
        label: "Square",
        value: false,
      },
    ],
  },
  {
    name: "Ellipse",
    icon: Ellipsis,
    type: "ellipse",
    category: "shape",
    menuType: "shapes",
    params: [
      { name: "bgColor", type: "color", label: "Background" },
      { name: "lineColor", type: "color", label: "Border" },
      {
        name: "lineWidth",
        type: "count",
        min: 1,
        max: 10,
        step: 1,
        label: "Border Width",
      },
      {
        name: "isCircle",
        type: "checkbox",
        label: "Circle",
        value: false,
      },
      {
        name: "drawMethod",
        type: "select",
        label: "Draw Method",
        options: ["Center", "Corner"],
      },
    ],
  },
  {
    name: "Polygon",
    type: "polygon",
    category: "shape",
    menuType: "shapes",
    params: [
      { name: "bgColor", type: "color", label: "Background" },
      { name: "lineColor", type: "color", label: "Border" },
      {
        name: "lineWidth",
        type: "count",
        min: 1,
        max: 10,
        step: 1,
        label: "Border Width",
      },
      {
        name: "numberOfSides",
        type: "count",
        min: 3,
        max: 10,
        step: 1,
        label: "Sides",
        value: 3,
      },
    ],
  },
  {
    name: "Line",
    type: "path",
    category: "shape",
    menuType: "shapes",
    params: [
      { name: "lineColor", type: "color", label: "Border" },
      {
        name: "lineWidth",
        type: "count",
        min: 1,
        max: 10,
        step: 1,
        label: "Border Width",
      },
      {
        name: "isContinuous",
        type: "checkbox",
        label: "Continuos",
        value: false,
      },
    ],
  },
  {
    name: "Arc",
    type: "arc",
    category: "shape",
    menuType: "shapes",
    params: [
      { name: "lineColor", type: "color", label: "Border" },
      {
        name: "lineWidth",
        type: "count",
        min: 1,
        max: 10,
        step: 1,
        label: "Border Width",
      },
      {
        name: "arcType",
        type: "select",
        label: "Arc Type",
        options: ["bezier", "quadratic"],
        value: "bezier",
      },
    ],
  },
];

export const TEXT_TOOLS: Tool[] = [
  {
    name: "Text",
    icon: TypeIcon,
    type: "text",
    category: "text",
    menuType: "text",
    params: [
      { name: "fontSize", type: "count", min: 1, max: 100, step: 1, value: 16 },
      { name: "bgColor", type: "color", value: "black" },
      { name: "text", type: "text", label: "Text", value: "Hello" },
    ],
  },
];

// export const IMAGE_TOOLS: Tool[] = [
//   {
//     name: "Insert Photo",
//     icon: ImagePlus,
//     type: "image",
//     category: "image",
//     menuType: "image",
//   },
// ];

export const DRAWING_TOOLS: Tool[] = [
  {
    name: "Chalk",
    icon: Pen,
    type: "chalk",
    category: "drawing",
    menuType: "draw",
    params: [
      { name: "color", type: "color" },
      { name: "size", type: "count", min: 1, max: 100, step: 1 },
    ],
  },
  {
    name: "Pen",
    icon: Pen,
    type: "pen",
    category: "drawing",
    menuType: "draw",
    params: [
      { name: "color", type: "color" },
      { name: "size", type: "count", min: 1, max: 100, step: 1 },
    ],
  },

  {
    name: "Highlighter",
    icon: Highlighter,
    type: "highlighter",
    category: "drawing",
    menuType: "draw",
    params: [
      { name: "color", type: "color" },
      { name: "size", type: "count", min: 1, max: 100, step: 1 },
    ],
  },
  {
    name: "Pencil",
    icon: Pencil,
    type: "pencil",
    category: "drawing",
    menuType: "draw",
    params: [
      { name: "color", type: "color" },
      { name: "size", type: "count", min: 1, max: 100, step: 1 },
    ],
  },
];

// export const SELECT_TOOLS: Tool[] = [
//   {
//     name: "Rectangle Selection",
//     icon: RectangleHorizontal,
//     type: "select-rectangle",
//     menuType: "select",
//   },
//   {
//     name: "Ellipse Selection",
//     icon: Circle,
//     type: "select-ellipse",
//     menuType: "select",
//   },
//   {
//     name: "Polygon Selection",
//     icon: Hexagon,
//     type: "select-polygon",
//     menuType: "select",
//   },
//   {
//     name: "Path Selection",
//     icon: LineChartIcon,
//     type: "select-path",
//     menuType: "select",
//   },
//   {
//     name: "Freeform Selection",
//     icon: LassoSelect,
//     type: "select-freeform",
//     menuType: "select",
//   },
// ];

export const TOOLS: Record<MenuType, Tool[]> = {
  ai: [],
  shapes: SHAPE_TOOLS,
  draw: DRAWING_TOOLS,
  text: TEXT_TOOLS,
  adjustments: [],
  colors: [],
  filters: [],
};
