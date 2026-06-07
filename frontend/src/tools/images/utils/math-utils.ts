import { Point, Rect, Size } from "@images/types/geometry-types";
import { snapToGrid } from "./grid-utils";
import { parseIntegerPoint, scalePoint } from "./ui-utils";

export function clamp(value: number, low = 0, high = 255): number {
  return Math.max(low, Math.min(high, value));
}

export function round(value: number, precision = 0): number {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}

export function clampRect(rect: Rect, bound: Rect): Rect {
  let { x, y, width, height } = rect;
  x = clamp(x, bound.x, bound.x + bound.width);
  y = clamp(y, bound.y, bound.y + bound.height);
  const x2 = clamp(x + width, x, x + bound.width);
  const y2 = clamp(y + height, y, bound.y + bound.height);
  width = x2 - x;
  height = y2 - y;
  const result: Rect = { x, y, width, height };
  return result;
}

export function getAspectRatio(dimensions?: Size | Rect): number | undefined {
  return dimensions ? dimensions.width / dimensions.height : undefined;
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

export function domRectDimensions(domRect?: DOMRect): Size | undefined {
  if (!domRect) return undefined;
  const dim: Size = {
    width: domRect.width,
    height: domRect.height,
  };
  return dim;
}

export function rect2dim(rect?: Rect): Size | undefined {
  return rect
    ? {
        width: rect.width,
        height: rect.height,
      }
    : undefined;
}

export function transferToOrigin(rect: Rect): Rect {
  return {
    x: 0,
    y: 0,
    width: rect.width,
    height: rect.height,
  };
}

export function getRectTopLeftAndSize(
  startingPoint: Point,
  endpoint: Point,
  convertToSquare = false
): Rect {
  let width = endpoint.x - startingPoint.x;
  let height = endpoint.y - startingPoint.y;
  if (convertToSquare) {
    // make width and height equal in abs-value but keep the sign
    const a = Math.max(Math.abs(width), Math.abs(height));
    width = a * Math.sign(width);
    height = a * Math.sign(height);
  }
  let topLeft: Point;
  let size: Size;
  if (width >= 0 && height >= 0) {
    topLeft = {
      x: startingPoint.x,
      y: startingPoint.y,
    };
    size = {
      width,
      height,
    };
  } else if (width < 0 && height >= 0) {
    topLeft = {
      x: startingPoint.x + width,
      y: startingPoint.y,
    };
    size = {
      width: Math.abs(width),
      height,
    };
  } else if (width >= 0 && height < 0) {
    topLeft = {
      x: startingPoint.x,
      y: startingPoint.y + height,
    };
    size = {
      width,
      height: Math.abs(height),
    };
  } else {
    topLeft = {
      x: startingPoint.x + width,
      y: startingPoint.y + height,
    };
    size = {
      width: Math.abs(width),
      height: Math.abs(height),
    };
  }
  return { ...topLeft, ...size };
}

export function getCenter(rect: Rect): Point {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
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
