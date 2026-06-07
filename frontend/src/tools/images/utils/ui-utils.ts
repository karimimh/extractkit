import { Point, Rect, Size } from "@images/types/geometry-types";

export function scalePoint(
  point: Point,
  fromFrame: Rect,
  toFrame: Rect
): Point {
  const { x, y } = point;
  const scaleX = toFrame.width / fromFrame.width;
  const scaleY = toFrame.height / fromFrame.height;

  // point translated to the origin of the fromFrame
  const p = {
    x: x - fromFrame.x,
    y: y - fromFrame.y,
  };
  const scaledPoint: Point = {
    x: toFrame.x + p.x * scaleX,
    y: toFrame.y + p.y * scaleY,
  };
  return scaledPoint;
}

export function scaleRect(rect: Rect, fromFrame: Rect, toFrame: Rect): Rect {
  const { x, y, width, height } = rect;
  const p1 = { x, y };
  const p2 = { x: x + width, y: y + height };
  const scaledP1 = scalePoint(p1, fromFrame, toFrame);
  const scaledP2 = scalePoint(p2, fromFrame, toFrame);
  const scaledRect: Rect = {
    x: scaledP1.x,
    y: scaledP1.y,
    width: scaledP2.x - scaledP1.x,
    height: scaledP2.y - scaledP1.y,
  };
  return scaledRect;
}

export function parseInteger(rect: Rect): Rect {
  return {
    x: Math.floor(rect.x),
    y: Math.floor(rect.y),
    width: Math.floor(rect.width),
    height: Math.floor(rect.height),
  };
}

export function parseIntegerPoint(point: Point): Point {
  return {
    x: Math.floor(point.x),
    y: Math.floor(point.y),
  };
}

export function parseIntegerSize(size: Size): Size {
  return {
    width: Math.floor(size.width),
    height: Math.floor(size.height),
  };
}

export function rectContains(rect: Rect, point: Point): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

export function getDimensionString(dimension: number | string): string {
  if (typeof dimension === "number") {
    return `${dimension}px`;
  }
  return dimension;
}
