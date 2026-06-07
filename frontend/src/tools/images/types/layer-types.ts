import { Adjustment } from "./adjustment-types";
import { Colorization, ColorStyle } from "./colorization-types";
import { Enhancement } from "./enhancement-types";
import { Filter } from "./filter-types";
import { Point, Rect, Size } from "./geometry-types";

export type Edit = Adjustment | Filter | Enhancement | Colorization;

export interface TextProperties {
  content: string;
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;
  justify?: "left" | "center" | "right";
  baseline?: "alphabetic" | "top" | "bottom" | "middle" | "hanging" | "ideographic";
}

export interface BaseLayerObject {
  category: "content" | "adjustment" | "colorization" | "enhancement" | "filter";
  id: string;
  type: string;
  hidden?: boolean;
}

export interface BaseContentObject extends BaseLayerObject {
  category: "content";
  frame: Rect;
  text?: TextProperties;
  rotation?: number;
}

export interface ImageObject extends BaseContentObject {
  type: "image";
  src: string;
  originalSrc: string;
  originalSize: Size;
  cropFrame: Rect;
  previewSrc?: string;
  edits?: Edit[];
  detectedObjects?: {
    label: string;
    score: number;
    box: Rect;
  }[];
}

export interface RectangleObject extends BaseContentObject {
  type: "rectangle";
  bgColor?: ColorStyle;
  lineWidth?: number;
  lineColor?: ColorStyle;
  lineDash?: number[];
  cornerRadius?: number;
  isSelection?: boolean;
}

export interface ArcObject extends BaseContentObject {
  type: "arc";
  arcType: "bezier" | "quadratic";
  points: Point[];
  bgColor?: ColorStyle;
  lineWidth?: number;
  lineColor?: ColorStyle;
  lineDash?: number[];
  isSelection?: boolean;
}

export interface EllipseObject extends BaseContentObject {
  type: "ellipse";
  center: Point;
  radiusX: number;
  radiusY: number;
  rotation?: number;
  startAngle?: number;
  endAngle?: number;
  ccw?: boolean;
  bgColor?: ColorStyle;
  lineWidth?: number;
  lineColor?: ColorStyle;
  lineDash?: number[];
  isSelection?: boolean;
}

export interface FreeformObject extends BaseContentObject {
  type: "freeform";
  points: Point[];
  bgColor?: ColorStyle;
  lineWidth?: number;
  lineColor?: ColorStyle;
  lineDash?: number[];
  isSelection?: boolean;
}

export interface ChalkParticle {
  type: "chalk";
  center: Point;
  points: Point[];
  alpha: number;
  color: ColorStyle;
  time: number;
  size: number;
}

export interface FountainPenParticle {
  type: "fountain-pen";
  center: Point;
  points: Point[];
  color: ColorStyle;
  size: number;
  time: number;
}

export interface WatercolorParticle {
  type: "watercolor";
  center: Point;
  color: ColorStyle;
  size: number;
  time: number;
}

export interface PencilParticle {
  type: "pencil";
  center: Point;
  points: Point[];
  alpha: number;
  color: ColorStyle;
  size: number;
  time: number;
}

export interface HighlighterParticle {
  type: "highlighter";
  center: Point;
  size: number;
  color: ColorStyle;
  time: number;
}

export interface PenParticle {
  type: "pen";
  center: Point;
  color: ColorStyle;
  size: number;
  time: number;
}

export interface ChalkObject extends BaseContentObject {
  type: "chalk";
  particles: ChalkParticle[];
}

export interface FountainPenObject extends BaseContentObject {
  type: "fountain-pen";
  particles: FountainPenParticle[];
}

export interface WatercolorObject extends BaseContentObject {
  type: "watercolor";
  particles: WatercolorParticle[];
}

export interface HighlighterObject extends BaseContentObject {
  type: "highlighter";
  particles: HighlighterParticle[];
}

export interface PenObject extends BaseContentObject {
  type: "pen";
  particles: PenParticle[];
}

export interface PencilObject extends BaseContentObject {
  type: "pencil";
  particles: PencilParticle[];
}

export interface PathObject extends BaseContentObject {
  type: "path" | "polygon";
  points: Point[];
  bgColor?: ColorStyle;
  lineWidth?: number;
  lineColor?: ColorStyle;
  lineDash?: number[];
  closed?: boolean;
  isSelection?: boolean;
}

export interface TextObject extends BaseContentObject {
  type: "text";
  frame: Rect;
}

export interface RectangleSelectionObject extends BaseContentObject {
  type: "select-rectangle";
  selection: RectangleObject;
}

export interface FreeformSelectionObject extends BaseContentObject {
  type: "select-freeform";
  selection: FreeformObject;
}

export type ContentObject =
  | ImageObject
  | RectangleObject
  | EllipseObject
  | FreeformObject
  | PathObject
  | ArcObject
  | TextObject
  | ChalkObject
  | FountainPenObject
  | WatercolorObject
  | HighlighterObject
  | PenObject
  | PencilObject
  | RectangleSelectionObject
  | FreeformSelectionObject;

export type LayerObject = ContentObject | Adjustment | Colorization | Enhancement | Filter;

export type LayerType = "content" | "adjustment" | "colorization" | "enhancement" | "filter";

export type Layer =
  | {
      type: "content"; // image, text, shape, drawing
      objects?: { [id: string]: ContentObject };
      name: string;
      id: string;
      objectOrders?: string[];
      hidden?: boolean;
    }
  | {
      type: "adjustment";
      objects?: { [id: string]: Adjustment };
      name: string;
      id: string;
      objectOrders?: string[];
      hidden?: boolean;
    }
  | {
      type: "colorization";
      objects?: { [id: string]: Colorization };
      name: string;
      id: string;
      objectOrders?: string[];
      hidden?: boolean;
    }
  | {
      type: "enhancement";
      objects?: { [id: string]: Enhancement };
      name: string;
      id: string;
      objectOrders?: string[];
      hidden?: boolean;
    }
  | {
      type: "filter";
      objects?: { [id: string]: Filter };
      name: string;
      id: string;
      objectOrders?: string[];
      hidden?: boolean;
    };
