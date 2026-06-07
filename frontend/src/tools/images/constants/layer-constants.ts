import {
  ChalkParticle,
  HighlighterParticle,
  PencilParticle,
  PenParticle,
} from "@images/types/layer-types";
import { ToolParam } from "@images/types/tool-types";
import { AlignCenter, AlignJustify, AlignLeft, AlignRight } from "lucide-react";

export type ExtendedToolParam = ToolParam & {
  getValue?: (KEY_VALUE_PAIRS: [string, any][]) => any;
  setValue?: (KEY_VALUE_PAIRS: [string, any][], value: any) => [string, any];
};

const FRAME_PARAMS: ExtendedToolParam[] = [
  {
    name: "x",
    type: "number",
    label: "X",
    min: 0,
    getValue: (KEY_VALUE_PAIRS: [string, any][]) =>
      KEY_VALUE_PAIRS.find((param) => param[0] === "frame")?.[1].x,
    setValue: (KEY_VALUE_PAIRS: [string, any][], value: any) => [
      "frame",
      {
        ...KEY_VALUE_PAIRS.find((param) => param[0] === "frame")?.[1],
        x: value,
      },
    ],
  },
  {
    name: "y",
    type: "number",
    label: "Y",
    min: 0,
    getValue: (KEY_VALUE_PAIRS: [string, any][]) =>
      KEY_VALUE_PAIRS.find((param) => param[0] === "frame")?.[1].y,
    setValue: (KEY_VALUE_PAIRS: [string, any][], value: any) => [
      "frame",
      {
        ...KEY_VALUE_PAIRS.find((param) => param[0] === "frame")?.[1],
        y: value,
      },
    ],
  },
  {
    name: "width",
    type: "number",
    label: "Width",
    min: 1,
    getValue: (KEY_VALUE_PAIRS: [string, any][]) =>
      KEY_VALUE_PAIRS.find((param) => param[0] === "frame")?.[1].width,
    setValue: (KEY_VALUE_PAIRS: [string, any][], value: any) => [
      "frame",
      {
        ...KEY_VALUE_PAIRS.find((param) => param[0] === "frame")?.[1],
        width: value,
      },
    ],
  },
  {
    name: "height",
    type: "number",
    label: "Height",
    min: 1,
    getValue: (KEY_VALUE_PAIRS: [string, any][]) =>
      KEY_VALUE_PAIRS.find((param) => param[0] === "frame")?.[1].height,
    setValue: (KEY_VALUE_PAIRS: [string, any][], value: any) => [
      "frame",
      {
        ...KEY_VALUE_PAIRS.find((param) => param[0] === "frame")?.[1],
        height: value,
      },
    ],
  },
];

export const TEXT_PARAMS: ExtendedToolParam[] = [
  {
    name: "text",
    type: "text",
    label: "Text",
    getValue: (KEY_VALUE_PAIRS: [string, any][]) =>
      KEY_VALUE_PAIRS.find((param) => param[0] === "text")?.[1].content,
    setValue: (KEY_VALUE_PAIRS: [string, any][], value: any) => [
      "text",
      {
        ...KEY_VALUE_PAIRS.find((param) => param[0] === "text")?.[1],
        content: value,
      },
    ],
  },
  {
    name: "font",
    type: "select",
    label: "Font",
    options: [
      "Arial",
      "Courier New",
      "Georgia",
      "Times New Roman",
      "Trebuchet MS",
      "Verdana",
    ],
    getValue: (KEY_VALUE_PAIRS: [string, any][]) =>
      KEY_VALUE_PAIRS.find((param) => param[0] === "text")?.[1].fontFamily,
    setValue: (KEY_VALUE_PAIRS: [string, any][], value: any) => [
      "text",
      {
        ...KEY_VALUE_PAIRS.find((param) => param[0] === "text")?.[1],
        fontFamily: value,
      },
    ],
  },
  {
    name: "size",
    type: "number",
    label: "Font Size",
    min: 1,
    inputType: "plus-minus",
    getValue: (KEY_VALUE_PAIRS: [string, any][]) =>
      KEY_VALUE_PAIRS.find((param) => param[0] === "text")?.[1].fontSize,
    setValue: (KEY_VALUE_PAIRS: [string, any][], value: any) => [
      "text",
      {
        ...KEY_VALUE_PAIRS.find((param) => param[0] === "text")?.[1],
        fontSize: value,
      },
    ],
  },
  {
    name: "color",
    type: "color",
    label: "Color",
    getValue: (KEY_VALUE_PAIRS: [string, any][]) =>
      KEY_VALUE_PAIRS.find((param) => param[0] === "text")?.[1].textColor,
    setValue: (KEY_VALUE_PAIRS: [string, any][], value: any) => [
      "text",
      {
        ...KEY_VALUE_PAIRS.find((param) => param[0] === "text")?.[1],
        textColor: value,
      },
    ],
  },
  {
    name: "justify",
    type: "select",
    label: "Justify",
    options: ["left", "center", "right", "justify"],
    icons: [AlignLeft, AlignCenter, AlignRight, AlignJustify],
    defaultValue: "center",
    inputType: "toggle-group",
    getValue: (KEY_VALUE_PAIRS: [string, any][]) =>
      KEY_VALUE_PAIRS.find((param) => param[0] === "text")?.[1].justify,
    setValue: (KEY_VALUE_PAIRS: [string, any][], value: any) => [
      "text",
      {
        ...KEY_VALUE_PAIRS.find((param) => param[0] === "text")?.[1],
        justify: value,
      },
    ],
  },
  {
    name: "baseline",
    type: "select",
    label: "Baseline",
    options: [
      "alphabetic",
      "top",
      "bottom",
      "middle",
      "hanging",
      "ideographic",
    ],
    getValue: (KEY_VALUE_PAIRS: [string, any][]) =>
      KEY_VALUE_PAIRS.find((param) => param[0] === "text")?.[1].baseline,
    setValue: (KEY_VALUE_PAIRS: [string, any][], value: any) => [
      "text",
      {
        ...KEY_VALUE_PAIRS.find((param) => param[0] === "text")?.[1],
        baseline: value,
      },
    ],
  },
];

const IMAGE_PARAMS: ExtendedToolParam[] = [...FRAME_PARAMS];
const RECTANGLE_PARAMS: ExtendedToolParam[] = [
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
    type: "number",
    min: 1,
    max: 100,
    label: "Border Width",
    inputType: "plus-minus",
  },
  {
    name: "cornerRadius",
    type: "number",
    label: "Corner Radius",
    max: 100,
    min: 0,
    inputType: "plus-minus",
  },
  ...FRAME_PARAMS,
  ...TEXT_PARAMS,
];

const ELLIPSE_PARAMS: ExtendedToolParam[] = [
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
    type: "slider",
    min: 1,
    max: 100,
    step: 1,
    label: "Border Width",
  },
  {
    name: "rotation",
    type: "slider",
    label: "Rotation",
    max: 360,
    min: 0,
  },
  {
    name: "radiusX",
    type: "number",
    label: "Radius X",
    min: 1,
  },
  {
    name: "radiusY",
    type: "number",
    label: "Radius Y",
    min: 1,
  },
  {
    name: "x",
    type: "number",
    label: "X",
    min: 0,
    getValue: (KEY_VALUE_PAIRS: [string, any][]) =>
      KEY_VALUE_PAIRS.find((param) => param[0] === "center")?.[1].x,
    setValue: (KEY_VALUE_PAIRS: [string, any][], value: any) => [
      "center",
      {
        ...KEY_VALUE_PAIRS.find((param) => param[0] === "center")?.[1],
        x: value,
      },
    ],
  },
  {
    name: "y",
    type: "number",
    label: "Y",
    min: 0,
    getValue: (KEY_VALUE_PAIRS: [string, any][]) =>
      KEY_VALUE_PAIRS.find((param) => param[0] === "center")?.[1].y,
    setValue: (KEY_VALUE_PAIRS: [string, any][], value: any) => [
      "center",
      {
        ...KEY_VALUE_PAIRS.find((param) => param[0] === "center")?.[1],
        y: value,
      },
    ],
  },
];

const PATH_PARAMS: ExtendedToolParam[] = [
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
    type: "slider",
    min: 1,
    max: 100,
    step: 1,
    label: "Border Width",
  },
];

const POLYGON_PARAMS: ExtendedToolParam[] = [
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
    type: "slider",
    min: 1,
    max: 100,
    step: 1,
    label: "Border Width",
  },
];

const CHALK_PARAMS: ExtendedToolParam[] = [
  {
    name: "color",
    type: "color",
    label: "Color",
    getValue: (KEY_VALUE_PAIRS: [string, any][]) => {
      const particles = KEY_VALUE_PAIRS.find(
        (param) => param[0] === "particles"
      )?.[1] as ChalkParticle[];
      return particles.length > 0 ? particles[0].color : undefined;
    },
    setValue: (KEY_VALUE_PAIRS: [string, any][], value: any) => {
      const particles = KEY_VALUE_PAIRS.find(
        (param) => param[0] === "particles"
      )?.[1] as ChalkParticle[];
      particles.forEach((particle) => {
        particle.color = value;
      });
      return ["particles", particles];
    },
  },
];

const PEN_PARAMS: ExtendedToolParam[] = [
  {
    name: "color",
    type: "color",
    label: "Color",
    getValue: (KEY_VALUE_PAIRS: [string, any][]) => {
      const particles = KEY_VALUE_PAIRS.find(
        (param) => param[0] === "particles"
      )?.[1] as PenParticle[];
      return particles.length > 0 ? particles[0].color : undefined;
    },
    setValue: (KEY_VALUE_PAIRS: [string, any][], value: any) => {
      const particles = KEY_VALUE_PAIRS.find(
        (param) => param[0] === "particles"
      )?.[1] as PenParticle[];
      particles.forEach((particle) => {
        particle.color = value;
      });
      return ["particles", particles];
    },
  },
];

const PENCIL_PARAMS: ExtendedToolParam[] = [
  {
    name: "color",
    type: "color",
    label: "Color",
    getValue: (KEY_VALUE_PAIRS: [string, any][]) => {
      const particles = KEY_VALUE_PAIRS.find(
        (param) => param[0] === "particles"
      )?.[1] as PencilParticle[];
      return particles.length > 0 ? particles[0].color : undefined;
    },
    setValue: (KEY_VALUE_PAIRS: [string, any][], value: any) => {
      const particles = KEY_VALUE_PAIRS.find(
        (param) => param[0] === "particles"
      )?.[1] as PencilParticle[];
      particles.forEach((particle) => {
        particle.color = value;
      });
      return ["particles", particles];
    },
  },
];

const HIGHLIGHTER_PARAMS: ExtendedToolParam[] = [
  {
    name: "color",
    type: "color",
    label: "Color",
    getValue: (KEY_VALUE_PAIRS: [string, any][]) => {
      const particles = KEY_VALUE_PAIRS.find(
        (param) => param[0] === "particles"
      )?.[1] as HighlighterParticle[];
      return particles.length > 0 ? particles[0].color : undefined;
    },
    setValue: (KEY_VALUE_PAIRS: [string, any][], value: any) => {
      const particles = KEY_VALUE_PAIRS.find(
        (param) => param[0] === "particles"
      )?.[1] as HighlighterParticle[];
      particles.forEach((particle) => {
        particle.color = value;
      });
      return ["particles", particles];
    },
  },
];

const SELECT_FREEFORM_PARAMS: ExtendedToolParam[] = [];

const ARC_PARAMS: ExtendedToolParam[] = [
  {
    name: "lineColor",
    type: "color",
    label: "Border",
  },
  {
    name: "lineWidth",
    type: "slider",
    min: 1,
    max: 100,
    step: 1,
    label: "Border Width",
  },
];

const FREEFORM_PARAMS: ExtendedToolParam[] = [];

const FOUNTAIN_PEN_PARAMS: ExtendedToolParam[] = [];

const WATERCOLOR_PARAMS: ExtendedToolParam[] = [];

const SELECT_RECTANGLE_PARAMS: ExtendedToolParam[] = [];

export const OBJECT_PARAMS = {
  image: IMAGE_PARAMS,
  rectangle: RECTANGLE_PARAMS,
  ellipse: ELLIPSE_PARAMS,
  path: PATH_PARAMS,
  polygon: POLYGON_PARAMS,
  chalk: CHALK_PARAMS,
  pen: PEN_PARAMS,
  pencil: PENCIL_PARAMS,
  highlighter: HIGHLIGHTER_PARAMS,
  "select-freeform": SELECT_FREEFORM_PARAMS,
  arc: ARC_PARAMS,
  freeform: FREEFORM_PARAMS,
  text: [...FRAME_PARAMS, ...TEXT_PARAMS],
  "fountain-pen": FOUNTAIN_PEN_PARAMS,
  watercolor: WATERCOLOR_PARAMS,
  "select-rectangle": SELECT_RECTANGLE_PARAMS,
};
