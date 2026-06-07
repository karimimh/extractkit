import { Point, Rect } from "@images/types/geometry-types";

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
