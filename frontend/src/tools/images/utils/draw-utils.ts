import { EllipseParams } from "@images/hooks/params/use-ellipse-params";
import { PathParams } from "@images/hooks/params/use-path-params";
import { PolygonParams } from "@images/hooks/params/use-polygon-params";
import { RectangleParams } from "@images/hooks/params/use-rectangle-params";
import { Point, Rect, Size } from "@images/types/geometry-types";
import {
  ArcObject,
  ChalkObject,
  ChalkParticle,
  EllipseObject,
  HighlighterObject,
  HighlighterParticle,
  PathObject,
  PencilObject,
  PencilParticle,
  PenObject,
  PenParticle,
  RectangleObject,
} from "@images/types/layer-types";
import { calculateEncircledPolygonPoints } from "./geometry-utils";
import { ArcParams } from "@images/hooks/params/use-arc-params";

export const getRectangleObject = (
  frame: Rect | undefined,
  props: RectangleParams,
  id: string
): RectangleObject | undefined => {
  if (!frame) return undefined;
  return {
    type: "rectangle",
    id,
    frame,
    bgColor: props.bgColor,
    cornerRadius: props.cornerRadius,
    lineWidth: props.lineWidth,
    lineColor: props.lineColor,
  };
};

export const getEllipseObject = (
  center: Point | undefined,
  size: Size | undefined,
  props: EllipseParams,
  id: string
): EllipseObject | undefined => {
  if (!center || !size) return undefined;
  return {
    type: "ellipse",
    id,
    center,
    radiusX: size.width,
    radiusY: size.height,
    bgColor: props.bgColor,
    lineWidth: props.lineWidth,
    lineColor: props.lineColor,
    frame: {
      x: center.x - size.width,
      y: center.y - size.height,
      width: size.width * 2,
      height: size.height * 2,
    },
  };
};

export const getPathObject = (
  points: Point[],
  bounds: Rect | undefined,
  props: PathParams,
  id: string
): PathObject | undefined => {
  if (points.length < 1 || !bounds) return undefined;
  return {
    type: "path",
    id,
    points,
    lineWidth: props.lineWidth,
    lineColor: props.lineColor,
    frame: bounds,
  };
};

export const getPolygonObject = (
  startingPoint: Point | undefined,
  endPoint: Point | undefined,
  bounds: Rect | undefined,
  props: PolygonParams,
  id: string
): PathObject | undefined => {
  if (!startingPoint || !endPoint || !bounds) return undefined;
  const polygonPoints = calculateEncircledPolygonPoints(
    props.numberOfSides,
    startingPoint,
    endPoint
  );
  if (polygonPoints.length < 3) return undefined;
  return {
    type: "polygon",
    id,
    points: polygonPoints,
    lineWidth: props.lineWidth,
    lineColor: props.lineColor,
    bgColor: props.bgColor,
    lineDash: props.lineDash,
    frame: bounds,
  };
};

export const getArcObject = (
  points: Point[],
  bounds: Rect | undefined,
  props: ArcParams,
  id: string
): ArcObject | undefined => {
  if (points.length === 0 || !bounds) return undefined;
  return {
    type: "arc",
    id,
    points,
    lineColor: props.lineColor,
    lineWidth: props.lineWidth,
    arcType: props.arcType,
    frame: bounds,
  };
};

export const getChalkObject = (
  particles: ChalkParticle[],
  bounds: Rect | undefined,
  id: string
): ChalkObject | undefined => {
  if (particles.length === 0 || !bounds) return undefined;
  return {
    type: "chalk",
    id,
    particles,
    frame: bounds,
  };
};

export const getPenObject = (
  particles: PenParticle[],
  bounds: Rect | undefined,
  id: string
): PenObject | undefined => {
  if (particles.length === 0 || !bounds) return undefined;
  return {
    type: "pen",
    id,
    particles,
    frame: bounds,
  };
};

export const getPencilObject = (
  particles: PencilParticle[],
  bounds: Rect | undefined,
  id: string
): PencilObject | undefined => {
  if (particles.length === 0 || !bounds) return undefined;
  return {
    type: "pencil",
    id,
    particles,
    frame: bounds,
  };
};

export const getHighlighterObject = (
  particles: HighlighterParticle[],
  bounds: Rect | undefined,
  id: string
): HighlighterObject | undefined => {
  if (particles.length === 0 || !bounds) return undefined;
  return {
    type: "highlighter",
    id,
    particles,
    frame: bounds,
  };
};
