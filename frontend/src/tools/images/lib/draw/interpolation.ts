import { Point } from "../../types/geometry-types";

function linearInterpolate(p1: Point, p2: Point, factor: number): Point {
  return {
    x: p1.x + (p2.x - p1.x) * factor,
    y: p1.y + (p2.y - p1.y) * factor,
  };
}

// Cubic Spline Interpolation (Catmull-Rom)
function catmullRomSplineInterpolate(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number
): Point {
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x:
      0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y:
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  };
}

// Bezier Interpolation (Quadratic)
function bezierInterpolate(p0: Point, p1: Point, p2: Point, t: number): Point {
  const oneMinusT = 1 - t;

  return {
    x: oneMinusT * oneMinusT * p0.x + 2 * oneMinusT * t * p1.x + t * t * p2.x,
    y: oneMinusT * oneMinusT * p0.y + 2 * oneMinusT * t * p1.y + t * t * p2.y,
  };
}

export function interpolatePoints(
  points: Point[],
  numInterpolatedPoints: number,
  method: "linear" | "spline" | "bezier" = "linear"
): Point[] {
  if (points.length < 2) return points;

  const interpolatedPoints: Point[] = [];

  if (method === "linear") {
    // Linear interpolation
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      interpolatedPoints.push(p1);

      for (let j = 1; j <= numInterpolatedPoints; j++) {
        const factor = j / (numInterpolatedPoints + 1);
        const newPoint = linearInterpolate(p1, p2, factor);
        interpolatedPoints.push(newPoint);
      }
    }
  } else if (method === "spline") {
    // Spline interpolation (Catmull-Rom)
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      interpolatedPoints.push(p1);

      for (let j = 1; j <= numInterpolatedPoints; j++) {
        const factor = j / (numInterpolatedPoints + 1);
        const newPoint = catmullRomSplineInterpolate(p0, p1, p2, p3, factor);
        interpolatedPoints.push(newPoint);
      }
    }
  } else if (method === "bezier") {
    // Bezier interpolation
    for (let i = 0; i < points.length - 2; i += 2) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const p2 = points[i + 2];

      interpolatedPoints.push(p0);

      for (let j = 1; j <= numInterpolatedPoints; j++) {
        const factor = j / (numInterpolatedPoints + 1);
        const newPoint = bezierInterpolate(p0, p1, p2, factor);
        interpolatedPoints.push(newPoint);
      }
    }
  }

  interpolatedPoints.push(points[points.length - 1]);
  return interpolatedPoints;
}
