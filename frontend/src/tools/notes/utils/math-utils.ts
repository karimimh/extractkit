import type { Point, Rect, Size } from "@notes/types/geometry-types";

export function clamp(value: number, low = 0, high = 255): number {
  return Math.max(low, Math.min(high, value));
}

export function round(value: number, precision = 0): number {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}

export function scalePoint(point: Point, fromFrame: Rect, toFrame: Rect): Point {
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

export function domRectToRect(domRect?: DOMRect): Rect | undefined {
  const imageBounds: Rect | undefined = domRect
    ? {
        x: domRect.x,
        y: domRect.y,
        width: domRect.width,
        height: domRect.height,
      }
    : undefined;
  return imageBounds;
}

export function snapToGrid(
  point: Point,
  containerWidth: number,
  containerHeight: number,
  grid?: {
    rows: number;
    columns: number;
  }
) {
  if (!grid) return point;
  const gridWidth = containerWidth / grid.columns;
  const gridHeight = containerHeight / grid.rows;
  point = {
    x: Math.round(point.x / gridWidth) * gridWidth,
    y: Math.round(point.y / gridHeight) * gridHeight,
  };
  return point;
}

export function snapRectToGrid(
  rect: Rect,
  containerWidth: number,
  containerHeight: number,
  grid?: {
    rows: number;
    columns: number;
  }
) {
  if (!grid) return rect;
  const gridWidth = containerWidth / grid.columns;
  const gridHeight = containerHeight / grid.rows;
  rect = {
    x: Math.round(rect.x / gridWidth) * gridWidth,
    y: Math.round(rect.y / gridHeight) * gridHeight,
    width: Math.round(rect.width / gridWidth) * gridWidth,
    height: Math.round(rect.height / gridHeight) * gridHeight,
  };
  return rect;
}

export const getPointerPositionInFrame = (
  e: React.MouseEvent | React.TouchEvent,
  element: HTMLElement | null,
  destinationFrame: Rect | undefined,
  snapIsEnabled = false,
  grid:
    | {
        rows: number;
        columns: number;
      }
    | undefined = undefined
): Point | undefined => {
  const rect = element?.getBoundingClientRect();
  if (!destinationFrame || !rect) return undefined;

  let x: number, y: number;
  if ("touches" in e) {
    const touch = e.touches[0] || e.changedTouches[0];
    x = Math.max(0, touch.clientX - rect.left);
    y = Math.max(0, touch.clientY - rect.top);
  } else {
    x = Math.max(0, e.clientX - rect.left);
    y = Math.max(0, e.clientY - rect.top);
  }
  let mousePos: Point = { x, y };
  if (snapIsEnabled) {
    mousePos = snapToGrid(mousePos, rect.width, rect.height, grid);
  }
  const frame = {
    x: 0,
    y: 0,
    width: rect.width,
    height: rect.height,
  };
  const newMousePosition = parseIntegerPoint(scalePoint(mousePos, frame, destinationFrame));
  return newMousePosition;
};
