import { ColorStyle } from "../../types/colorization-types";
import { Point } from "../../types/geometry-types";
import { ChalkParticle, PenParticle } from "../../types/layer-types";
import { interpolatePoints } from "./interpolation";

export const generateChalkParticlePoints = (
  point: Point,
  particleSize: number
) => {
  const particlePoints: Point[] = [];
  for (let i = 0; i < particleSize; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * particleSize;
    const x = point.x + radius * Math.cos(angle);
    const y = point.y + radius * Math.sin(angle);
    particlePoints.push({ x, y });
  }
  return particlePoints;
};

export const generatePencilParticlePoints = (
  point: Point,
  particleSize: number
) => {
  const particlePoints: Point[] = [];
  for (let i = 0; i < particleSize; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * (particleSize / 8);
    const x = point.x + radius * Math.cos(angle);
    const y = point.y + radius * Math.sin(angle);
    particlePoints.push({ x, y });
  }
  return particlePoints;
};

function drawSprayParticle(
  point: Point,
  sprayDensity: number,
  airbrushSize: number,
  ctx: CanvasRenderingContext2D
) {
  for (let i = 0; i < sprayDensity; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * airbrushSize;
    const x = point.x + radius * Math.cos(angle);
    const y = point.y + radius * Math.sin(angle);
    ctx.fillRect(x, y, 1, 1);
  }
}

function drawMarkerParticle(
  point: Point,
  markerSize: number,
  markerColor: string,
  ctx: CanvasRenderingContext2D
) {
  ctx.fillStyle = markerColor;
  ctx.beginPath();
  ctx.arc(point.x, point.y, markerSize, 0, Math.PI * 2);
  ctx.fill();
}

function drawPencilParticle(
  point: Point,
  pencilSize: number,
  pencilColor: string,
  ctx: CanvasRenderingContext2D
) {
  ctx.fillStyle = pencilColor;
  ctx.globalAlpha = 0.1; // mimic pencil shading
  ctx.beginPath();
  ctx.arc(point.x, point.y, pencilSize, 0, Math.PI * 2);
  ctx.fill();
}

function drawFountainPenParticle(
  point: Point,
  fountainPenSize: number,
  fountainPenColor: string,
  ctx: CanvasRenderingContext2D
) {
  ctx.strokeStyle = fountainPenColor;
  ctx.lineWidth = fountainPenSize;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.lineTo(point.x, point.y);
  ctx.stroke();
}

function drawWatercolorParticle(
  point: Point,
  watercolorSize: number,
  watercolorColor: string,
  ctx: CanvasRenderingContext2D
) {
  ctx.fillStyle = watercolorColor;
  ctx.globalAlpha = Math.random() * 0.2 + 0.1; // transparent layers for watercolor effect
  ctx.beginPath();
  ctx.arc(point.x, point.y, watercolorSize, 0, Math.PI * 2);
  ctx.fill();

  // Simulate bleeding effect with random blurs around the central spot
  for (let i = 0; i < 5; i++) {
    const bleedX = point.x + (Math.random() - 0.5) * 15;
    const bleedY = point.y + (Math.random() - 0.5) * 15;
    const bleedRadius = watercolorSize * (Math.random() * 0.5 + 0.5);
    ctx.globalAlpha = Math.random() * 0.1 + 0.05;
    ctx.beginPath();
    ctx.arc(bleedX, bleedY, bleedRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}
