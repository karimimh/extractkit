import { Point, Rect, Size } from "@images/types/geometry-types";
import {
  ChalkObject,
  EllipseObject,
  HighlighterObject,
  ImageObject,
  ContentObject,
  PathObject,
  PencilObject,
  PenObject,
  RectangleObject,
} from "@images/types/layer-types";
import { clamp, getCenter } from "./math-utils";

export const calculateEncircledPolygonPoints = (
  sides: number,
  startingPoint: Point,
  endpoint: Point
): Point[] => {
  const points: Point[] = [];
  const angleStep = (2 * Math.PI) / sides;
  const centerX = startingPoint.x;
  const centerY = startingPoint.y;
  const radius = Math.max(
    Math.abs(startingPoint.x - endpoint.x),
    Math.abs(startingPoint.y - endpoint.y)
  );

  const startAngle = Math.PI / 2 - angleStep / 2;

  for (let i = 0; i < sides; i++) {
    const angle = startAngle + i * angleStep;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    points.push({ x, y });
  }

  return points;
};

function isPointInsidePolygon(point: Point, polygon: Point[]): boolean {
  const n = polygon.length;
  let inside = false;
  const { x, y } = point;

  for (let i = 0; i < n; i++) {
    const { x: x1, y: y1 } = polygon[i];
    const { x: x2, y: y2 } = polygon[(i + 1) % n];

    // Ray-casting logic
    if (y1 > y !== y2 > y && x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1) {
      inside = !inside;
    }
  }
  return inside;
}

export function rectContains(rect: Rect | undefined, point: Point): boolean {
  if (!rect) return false;
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

function isPointNearLine(
  lineStart: Point,
  lineEnd: Point,
  point: Point,
  tolerance: number
): boolean {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const d = dx * dx + dy * dy;
  const t = clamp((dx * (point.x - lineStart.x) + dy * (point.y - lineStart.y)) / d, 0, 1);
  const x = lineStart.x + t * dx;
  const y = lineStart.y + t * dy;
  const distance = Math.sqrt((point.x - x) * (point.x - x) + (point.y - y) * (point.y - y));
  return distance < tolerance;
}

export function rectangleObjectContainsPoint(object: RectangleObject, point: Point): boolean {
  const { bgColor, frame, lineWidth } = object;
  const isFilled = Boolean(bgColor);
  if (isFilled) {
    return rectContains(frame, point);
  }
  const tolerance = lineWidth ?? 1;
  return (
    isPointNearLine(
      { x: frame.x, y: frame.y },
      { x: frame.x + frame.width, y: frame.y },
      point,
      tolerance
    ) ||
    isPointNearLine(
      { x: frame.x + frame.width, y: frame.y },
      { x: frame.x + frame.width, y: frame.y + frame.height },
      point,
      tolerance
    ) ||
    isPointNearLine(
      { x: frame.x + frame.width, y: frame.y + frame.height },
      { x: frame.x, y: frame.y + frame.height },
      point,
      tolerance
    ) ||
    isPointNearLine(
      { x: frame.x, y: frame.y + frame.height },
      { x: frame.x, y: frame.y },
      point,
      tolerance
    )
  );
}

function ellipseAreaContainsPoint(center: Point, radius: Size, point: Point): boolean {
  const { x, y } = point;
  const { width, height } = radius;
  const dx = x - center.x;
  const dy = y - center.y;
  return (dx * dx) / (width * width) + (dy * dy) / (height * height) <= 1;
}

export function ellipseObjectContainsPoint(object: EllipseObject, point: Point): boolean {
  const { bgColor, center, radiusX, radiusY, lineWidth } = object;
  const isFilled = Boolean(bgColor);
  if (isFilled) {
    return ellipseAreaContainsPoint(center, { width: radiusX, height: radiusY }, point);
  }
  const borderWidth = lineWidth ?? 1;
  const upperBorderProximityEllipse: EllipseObject = {
    ...object,
    radiusX: radiusX + borderWidth / 2,
    radiusY: radiusY + borderWidth / 2,
  };
  const lowerBorderProximityEllipse: EllipseObject = {
    ...object,
    radiusX: radiusX + borderWidth / 2,
    radiusY: radiusY + borderWidth / 2,
  };
  return (
    ellipseAreaContainsPoint(
      center,
      {
        width: upperBorderProximityEllipse.radiusX,
        height: upperBorderProximityEllipse.radiusY,
      },
      point
    ) &&
    !ellipseAreaContainsPoint(
      center,
      {
        width: lowerBorderProximityEllipse.radiusX,
        height: lowerBorderProximityEllipse.radiusY,
      },
      point
    )
  );
}

export function pathObjectContainsPoint(object: PathObject, point: Point): boolean {
  const { points, lineWidth, bgColor } = object;
  const isFilled = Boolean(bgColor);
  const tolerance = lineWidth ?? 1;
  const n = points.length;
  if (isFilled) {
    return isPointInsidePolygon(point, points);
  }
  for (let i = 0; i < n; i++) {
    const start = points[i];
    const end = points[(i + 1) % n];
    if (isPointNearLine(start, end, point, tolerance)) {
      return true;
    }
  }
  return false;
}

export function drawingObjectContainsPoint(
  object: ChalkObject | PenObject | PencilObject | HighlighterObject,
  point: Point
): boolean {
  const { particles } = object;
  const n = particles.length;
  const toleranceFactorMap = {
    chalk: 1,
    pen: 0.5,
    pencil: 0.125,
    highlighter: 0.5,
  };
  for (let i = 0; i <= n - 2; i++) {
    const start = particles[i].center;
    const end = particles[i + 1].center;
    const tolerance = particles[i].size * toleranceFactorMap[object.type];
    if (isPointNearLine(start, end, point, tolerance)) {
      return true;
    }
  }
  return false;
}

export function imageObjectContainsPoint(object: ImageObject, point: Point): boolean {
  const { frame } = object;
  return rectContains(frame, point);
}

export function layerObjectContainsPoint(object: ContentObject, point: Point): boolean {
  return rectContains(object.frame, point);
}

export function getObjectCenter(object: ContentObject): Point {
  switch (object.type) {
    case "rectangle":
      return getCenter(object.frame);
    case "ellipse":
      return object.center;
    case "path":
    case "polygon": {
      const { points } = object;
      const n = points.length;
      let sumX = 0;
      let sumY = 0;
      for (let i = 0; i < n; i++) {
        sumX += points[i].x;
        sumY += points[i].y;
      }
      return {
        x: sumX / n,
        y: sumY / n,
      };
    }
    case "chalk":
    case "pen":
    case "pencil":
    case "highlighter": {
      const { particles } = object;
      const n = particles.length;
      let sumX = 0;
      let sumY = 0;
      for (let i = 0; i < n; i++) {
        sumX += particles[i].center.x;
        sumY += particles[i].center.y;
      }
      return {
        x: sumX / n,
        y: sumY / n,
      };
    }
    case "image":
      return getCenter(object.frame);
    default:
      return { x: 0, y: 0 };
  }
}

export function isPointInMovingArea(point: Point, frame: Rect): boolean {
  const RESIZE_BORDER = 10;
  const { width: w, height: h } = frame;

  const insideArea: Rect = {
    x: frame.x + RESIZE_BORDER,
    y: frame.y + RESIZE_BORDER,
    width: frame.width - 2 * RESIZE_BORDER,
    height: frame.height - 2 * RESIZE_BORDER,
  };
  return rectContains(insideArea, point);
}

export function isPointInTopResizeArea(point: Point, frame: Rect): boolean {
  const RESIZE_BORDER = 10;
  const { x, y, width: w, height: h } = frame;

  const topArea: Rect = {
    x: x + RESIZE_BORDER,
    y: y,
    width: w - 2 * RESIZE_BORDER,
    height: RESIZE_BORDER,
  };

  return rectContains(topArea, point);
}

export function isPointInBottomResizeArea(point: Point, frame: Rect): boolean {
  const RESIZE_BORDER = 10;
  const { x, y, width: w, height: h } = frame;

  const bottomArea: Rect = {
    x: x + RESIZE_BORDER,
    y: y + h - RESIZE_BORDER,
    width: w - 2 * RESIZE_BORDER,
    height: RESIZE_BORDER,
  };

  return rectContains(bottomArea, point);
}

export function isPointInLeftResizeArea(point: Point, frame: Rect): boolean {
  const RESIZE_BORDER = 10;
  const { x, y, width: w, height: h } = frame;

  const leftArea: Rect = {
    x: x,
    y: y + RESIZE_BORDER,
    width: RESIZE_BORDER,
    height: h - 2 * RESIZE_BORDER,
  };

  return rectContains(leftArea, point);
}

export function isPointInRightResizeArea(point: Point, frame: Rect): boolean {
  const RESIZE_BORDER = 10;
  const { x, y, width: w, height: h } = frame;

  const rightArea: Rect = {
    x: x + w - RESIZE_BORDER,
    y: y + RESIZE_BORDER,
    width: RESIZE_BORDER,
    height: h - 2 * RESIZE_BORDER,
  };

  return rectContains(rightArea, point);
}

export function isPointInTopLeftResizeArea(point: Point, frame: Rect): boolean {
  const RESIZE_BORDER = 10;
  const { x, y, width: w, height: h } = frame;

  const topLeftArea: Rect = {
    x: x,
    y: y,
    width: RESIZE_BORDER,
    height: RESIZE_BORDER,
  };

  return rectContains(topLeftArea, point);
}

export function isPointInTopRightResizeArea(point: Point, frame: Rect): boolean {
  const RESIZE_BORDER = 10;
  const { x, y, width: w, height: h } = frame;

  const topRightArea: Rect = {
    x: x + w - RESIZE_BORDER,
    y: y,
    width: RESIZE_BORDER,
    height: RESIZE_BORDER,
  };

  return rectContains(topRightArea, point);
}

export function isPointInBottomLeftResizeArea(point: Point, frame: Rect): boolean {
  const RESIZE_BORDER = 10;
  const { x, y, width: w, height: h } = frame;

  const bottomLeftArea: Rect = {
    x: x,
    y: y + h - RESIZE_BORDER,
    width: RESIZE_BORDER,
    height: RESIZE_BORDER,
  };

  return rectContains(bottomLeftArea, point);
}

export function isPointInBottomRightResizeArea(point: Point, frame: Rect): boolean {
  const RESIZE_BORDER = 10;
  const { x, y, width: w, height: h } = frame;

  const bottomRightArea: Rect = {
    x: x + w - RESIZE_BORDER,
    y: y + h - RESIZE_BORDER,
    width: RESIZE_BORDER,
    height: RESIZE_BORDER,
  };

  return rectContains(bottomRightArea, point);
}

export type PointArea =
  | "move"
  | "top-resize"
  | "bottom-resize"
  | "left-resize"
  | "right-resize"
  | "top-left-resize"
  | "top-right-resize"
  | "bottom-left-resize"
  | "bottom-right-resize";

export function getPointArea(point: Point, frame: Rect): PointArea | undefined {
  if (isPointInMovingArea(point, frame)) {
    return "move";
  }
  if (isPointInTopResizeArea(point, frame)) {
    return "top-resize";
  }
  if (isPointInBottomResizeArea(point, frame)) {
    return "bottom-resize";
  }
  if (isPointInLeftResizeArea(point, frame)) {
    return "left-resize";
  }
  if (isPointInRightResizeArea(point, frame)) {
    return "right-resize";
  }
  if (isPointInTopLeftResizeArea(point, frame)) {
    return "top-left-resize";
  }
  if (isPointInTopRightResizeArea(point, frame)) {
    return "top-right-resize";
  }
  if (isPointInBottomLeftResizeArea(point, frame)) {
    return "bottom-left-resize";
  }
  if (isPointInBottomRightResizeArea(point, frame)) {
    return "bottom-right-resize";
  }
  return undefined;
}

export function calculateEditedFrame(
  initialRect: Rect,
  initaliaPoint: Point,
  currentPoint: Point,
  editAction: PointArea | undefined
) {
  const moveX = currentPoint.x - initaliaPoint.x;
  const moveY = currentPoint.y - initaliaPoint.y;
  let newFrame: Rect | null = null;
  if (editAction === "move") {
    newFrame = {
      x: initialRect.x + moveX,
      y: initialRect.y + moveY,
      width: initialRect.width,
      height: initialRect.height,
    };
  } else if (editAction === "top-resize") {
    newFrame = {
      x: initialRect.x,
      y: initialRect.y + moveY,
      width: initialRect.width,
      height: initialRect.height - moveY,
    };
  } else if (editAction === "bottom-resize") {
    newFrame = {
      x: initialRect.x,
      y: initialRect.y,
      width: initialRect.width,
      height: initialRect.height + moveY,
    };
  } else if (editAction === "left-resize") {
    newFrame = {
      x: initialRect.x + moveX,
      y: initialRect.y,
      width: initialRect.width - moveX,
      height: initialRect.height,
    };
  } else if (editAction === "right-resize") {
    newFrame = {
      x: initialRect.x,
      y: initialRect.y,
      width: initialRect.width + moveX,
      height: initialRect.height,
    };
  } else if (editAction === "top-left-resize") {
    newFrame = {
      x: initialRect.x + moveX,
      y: initialRect.y + moveY,
      width: initialRect.width - moveX,
      height: initialRect.height - moveY,
    };
  } else if (editAction === "top-right-resize") {
    newFrame = {
      x: initialRect.x,
      y: initialRect.y + moveY,
      width: initialRect.width + moveX,
      height: initialRect.height - moveY,
    };
  } else if (editAction === "bottom-left-resize") {
    newFrame = {
      x: initialRect.x + moveX,
      y: initialRect.y,
      width: initialRect.width - moveX,
      height: initialRect.height + moveY,
    };
  } else if (editAction === "bottom-right-resize") {
    newFrame = {
      x: initialRect.x,
      y: initialRect.y,
      width: initialRect.width + moveX,
      height: initialRect.height + moveY,
    };
  }
  return newFrame;
}
