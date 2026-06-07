import { loadImage } from "@images/utils/image-utils";
import { generateId } from "@images/utils/object-utils";
import { Point, Rect } from "../../types/geometry-types";
import {
  ArcObject,
  ChalkObject,
  EllipseObject,
  FreeformObject,
  HighlighterObject,
  ImageObject,
  ContentObject,
  PathObject,
  PencilObject,
  PenObject,
  RectangleObject,
  TextObject,
} from "../../types/layer-types";
import { applyAdjustment, applyColorReplacement } from "../adjustments/adjustments";
import {
  applyClipping,
  applyDigitalNegative,
  applyThresholding,
  contrastStretch,
  convertToGrayscale,
  intensityLevelSlicing,
  logarithmicTransform,
  powerLawTransform,
} from "../cv/cv-point-ops";
import { applyEnhancement } from "../enhacements/enhancements";
import { applyFilter } from "../filters/filters";

export const drawImage = async (
  l: ImageObject,
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  guideRects?: Rect[],
  original?: boolean,
  isCropEnabled = false
) => {
  const image = await loadImage(original ? l.originalSrc : l.src);
  // const srcRect: Rect = isCropEnabled
  //   ? { x: 0, y: 0, width: l.originalSize.width, height: l.originalSize.height }
  //   : l.cropFrame;
  const destRect = l.frame;
  ctx.drawImage(
    image,
    // srcRect.x,
    // srcRect.y,
    // srcRect.width,
    // srcRect.height,
    destRect.x,
    destRect.y,
    destRect.width,
    destRect.height
  );
  if (original) return;
  for (const edit of l.edits ?? []) {
    if (edit.category === "adjustment") applyAdjustment(edit, ctx, canvasWidth, canvasHeight);
    else if (edit.category === "filter") applyFilter(edit, ctx, canvasWidth, canvasHeight);
    else if (edit.category === "enhancement")
      applyEnhancement(edit, ctx, canvasWidth, canvasHeight);
    else if (edit.type === "digital-negative") applyDigitalNegative(ctx, canvasWidth, canvasHeight);
    else if (edit.type === "thresholding")
      applyThresholding(ctx, canvasWidth, canvasHeight, edit.threshold);
    else if (edit.type === "clipping")
      applyClipping(ctx, canvasWidth, canvasHeight, edit.minIntensity, edit.maxIntensity);
    else if (edit.type === "contrast-stretching")
      contrastStretch(ctx, canvasWidth, canvasHeight, edit.s1, edit.r1, edit.s2, edit.r2);
    else if (edit.type === "intensity-level-slicing")
      intensityLevelSlicing(
        ctx,
        canvasWidth,
        canvasHeight,
        edit.minIntensity,
        edit.maxIntensity,
        edit.withBackground
      );
    else if (edit.type === "logarithmic-transformation")
      logarithmicTransform(ctx, canvasWidth, canvasHeight, edit.c);
    else if (edit.type === "power-law-transformation")
      powerLawTransform(ctx, canvasWidth, canvasHeight, edit.c, edit.gamma);
    else if (edit.type === "convert-to-grayscale")
      convertToGrayscale(ctx, canvasWidth, canvasHeight);
    else if (edit.type === "color-replacement")
      applyColorReplacement(
        edit.sourceColor,
        edit.targetColor,
        edit.range,
        ctx,
        canvasWidth,
        canvasHeight
      );
  }
  for (const rect of guideRects ?? []) {
    drawRectangle(
      {
        frame: rect,
        id: generateId(),
        type: "rectangle",
        lineColor: "blue",
        lineWidth: 2,
      },
      ctx
    );
  }
};

export const drawRectangle = async (l: RectangleObject, ctx: CanvasRenderingContext2D) => {
  const { x, y, width, height } = l.frame;
  const cornerRadius = l.cornerRadius ?? 0;

  ctx.beginPath();
  ctx.moveTo(x + cornerRadius, y);
  ctx.lineTo(x + width - cornerRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + cornerRadius);
  ctx.lineTo(x + width, y + height - cornerRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - cornerRadius, y + height);
  ctx.lineTo(x + cornerRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - cornerRadius);
  ctx.lineTo(x, y + cornerRadius);
  ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
  ctx.closePath();

  if (l.isSelection) drawLayerMask(ctx);

  if (l.bgColor) {
    ctx.fillStyle = l.bgColor;
    ctx.fill();
  }

  if (l.lineWidth) {
    ctx.strokeStyle = l.lineColor ?? "rgba(0,0,0,0)";
    ctx.lineWidth = l.lineWidth;
    if (l.lineDash) ctx.setLineDash(l.lineDash);
    ctx.stroke();
    if (l.lineDash) ctx.setLineDash([]);
  }

  if (l.text && l.text.content) {
    const { content, baseline, fontFamily, fontSize, justify, textColor } = l.text;
    ctx.fillStyle = textColor ?? "black";
    ctx.font = `${fontSize ?? 16}px ${fontFamily ?? "sans-serif"}`;
    ctx.textAlign = justify ?? "center";
    ctx.textBaseline = baseline ?? "middle";

    const lines = content.split("\n");
    const lineHeight = fontSize ?? 16;
    const textX = x + (justify === "left" ? 0 : justify === "right" ? width : width / 2);
    let textY =
      y +
      (baseline === "top" ? 0 : baseline === "bottom" ? height : height / 2) -
      ((lines.length - 1) * lineHeight) / 2;

    for (const line of lines) {
      ctx.fillText(line, textX, textY);
      textY += lineHeight;
    }
  }
};

export const drawPolygon = async (l: PathObject, ctx: CanvasRenderingContext2D) => {
  if (l.points.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(l.points[0].x, l.points[0].y);
  for (let i = 1; i < l.points.length; i++) ctx.lineTo(l.points[i].x, l.points[i].y);
  ctx.closePath();

  if (l.isSelection) drawLayerMask(ctx);

  if (l.bgColor) {
    ctx.fillStyle = l.bgColor;
    ctx.fill();
  }
  if (l.lineDash) ctx.setLineDash(l.lineDash);
  if (l.lineWidth && l.lineColor) {
    ctx.strokeStyle = l.lineColor;
    ctx.lineWidth = l.lineWidth;
    ctx.stroke();
  }
  // ctx.strokeRect(l.frame.x, l.frame.y, l.frame.width, l.frame.height);
};

export const drawEllipse = async (l: EllipseObject, ctx: CanvasRenderingContext2D) => {
  ctx.beginPath();
  ctx.ellipse(
    l.center.x,
    l.center.y,
    l.radiusX,
    l.radiusY,
    l.rotation ?? 0,
    l.startAngle ?? 0,
    l.endAngle ?? 2 * Math.PI,
    l.ccw
  );

  if (l.isSelection) drawLayerMask(ctx);

  if (l.bgColor) {
    ctx.fillStyle = l.bgColor;
    ctx.fill();
  }
  if (l.lineDash) ctx.setLineDash(l.lineDash);
  if (l.lineWidth && l.lineColor) {
    ctx.strokeStyle = l.lineColor;
    ctx.lineWidth = l.lineWidth;
    ctx.stroke();
  }
  // ctx.strokeRect(l.frame.x, l.frame.y, l.frame.width, l.frame.height);
};

export const drawPath = async (l: PathObject, ctx: CanvasRenderingContext2D) => {
  if (l.points.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(l.points[0].x, l.points[0].y);
  for (let i = 1; i < l.points.length; i++) ctx.lineTo(l.points[i].x, l.points[i].y);
  if (l.closed) ctx.closePath();

  if (l.isSelection) drawLayerMask(ctx);

  if (l.bgColor) {
    ctx.fillStyle = l.bgColor;
    ctx.fill();
  }
  if (l.lineDash) ctx.setLineDash(l.lineDash);
  if (l.lineWidth && l.lineColor) {
    ctx.strokeStyle = l.lineColor;
    ctx.lineWidth = l.lineWidth;
    ctx.stroke();
  }
  // ctx.strokeRect(l.frame.x, l.frame.y, l.frame.width, l.frame.height);
};

export const drawArc = async (l: ArcObject, ctx: CanvasRenderingContext2D) => {
  if (
    (l.arcType === "quadratic" && l.points.length < 3) ||
    (l.arcType === "bezier" && l.points.length < 4)
  ) {
    drawPath({ ...l, type: "path" }, ctx);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(l.points[0].x, l.points[0].y);
  if (l.arcType === "bezier") {
    for (let i = 1; i < l.points.length; i += 3)
      ctx.bezierCurveTo(
        l.points[i].x,
        l.points[i].y,
        l.points[i + 1].x,
        l.points[i + 1].y,
        l.points[i + 2].x,
        l.points[i + 2].y
      );
  } else {
    for (let i = 1; i < l.points.length; i += 2)
      ctx.quadraticCurveTo(l.points[i].x, l.points[i].y, l.points[i + 1].x, l.points[i + 1].y);
  }

  if (l.isSelection) drawLayerMask(ctx);

  if (l.bgColor) {
    ctx.fillStyle = l.bgColor;
    ctx.fill();
  }

  if (l.lineWidth && l.lineColor) {
    ctx.strokeStyle = l.lineColor;
    ctx.lineWidth = l.lineWidth;
    if (l.lineDash) ctx.setLineDash(l.lineDash);
    ctx.stroke();
    if (l.lineDash) ctx.setLineDash([]);
  }
  // ctx.strokeRect(l.frame.x, l.frame.y, l.frame.width, l.frame.height);
};

export const drawText = async (
  l: TextObject,
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number
) => {
  if (!l.text) return;
  const { x, y, width, height } = l.frame;
  const { content, baseline, fontFamily, fontSize, justify, textColor } = l.text;

  ctx.fillStyle = textColor ?? "black";
  ctx.font = `${fontSize ?? 16}px ${fontFamily ?? "sans-serif"}`;
  ctx.textAlign = justify ?? "center";
  ctx.textBaseline = baseline ?? "middle";

  const lines = content.split("\n");
  const lineHeight = fontSize ?? 16;
  const textX = x + (justify === "left" ? 0 : justify === "right" ? width : width / 2);
  let textY =
    y +
    (baseline === "top" ? 0 : baseline === "bottom" ? height : height / 2) -
    ((lines.length - 1) * lineHeight) / 2;

  for (const line of lines) {
    ctx.fillText(line, textX, textY);
    textY += lineHeight;
  }
  // ctx.strokeRect(l.frame.x, l.frame.y, l.frame.width, l.frame.height);
};

export const drawFreeform = async (l: FreeformObject, ctx: CanvasRenderingContext2D) => {
  if (l.points.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(l.points[0].x, l.points[0].y);
  for (let i = 1; i < l.points.length; i++) ctx.lineTo(l.points[i].x, l.points[i].y);

  if (l.isSelection) drawLayerMask(ctx);

  if (l.bgColor) {
    ctx.fillStyle = l.bgColor;
    ctx.fill();
  }

  if (l.lineWidth && l.lineColor) {
    ctx.strokeStyle = l.lineColor;
    ctx.lineWidth = l.lineWidth;
    if (l.lineDash) ctx.setLineDash(l.lineDash);
    ctx.stroke();
    if (l.lineDash) ctx.setLineDash([]);
  }
};

function drawLayerMask(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.globalCompositeOperation = "destination-over";
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.clip();
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
}

export const drawChalkObject = async (l: ChalkObject, ctx: CanvasRenderingContext2D) => {
  for (let i = 0; i < l.particles.length; i++) {
    const particle = l.particles[i];
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = particle.alpha; // simulate uneven opacity of chalk
    for (let i = 0; i < particle.points.length; i++) {
      ctx.fillRect(particle.points[i].x, particle.points[i].y, 1, 1);
    }
  }
  // ctx.strokeRect(l.frame.x, l.frame.y, l.frame.width, l.frame.height);
  ctx.globalAlpha = 1;
};

export const drawPenObject = async (object: PenObject, ctx: CanvasRenderingContext2D) => {
  if (object.particles.length === 0) return;
  ctx.strokeStyle = object.particles[0].color;
  ctx.lineWidth = object.particles[0].size;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(object.particles[0].center.x, object.particles[0].center.y);
  for (let i = 1; i < object.particles.length; i++) {
    ctx.lineTo(object.particles[i].center.x, object.particles[i].center.y);
  }
  ctx.stroke();
  // ctx.strokeRect(object.frame.x, object.frame.y, object.frame.width, object.frame.height);
};

export const drawHighlighterObject = async (
  object: HighlighterObject,
  ctx: CanvasRenderingContext2D
) => {
  if (object.particles.length === 0) return;

  ctx.globalAlpha = 0.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(object.particles[0].center.x, object.particles[0].center.y);

  for (let i = 1; i < object.particles.length; i++) {
    const particle = object.particles[i];
    ctx.strokeStyle = particle.color;
    ctx.lineWidth = particle.size;
    ctx.lineTo(particle.center.x, particle.center.y);
  }

  ctx.stroke();
  // ctx.strokeRect(object.frame.x, object.frame.y, object.frame.width, object.frame.height);
  ctx.globalAlpha = 1.0;
};

export const drawPencilObject = async (l: PencilObject, ctx: CanvasRenderingContext2D) => {
  ctx.globalAlpha = 0.2;
  ctx.lineCap = "square";
  ctx.lineJoin = "round";
  for (let i = 0; i < l.particles.length; i++) {
    const particle = l.particles[i];
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = particle.alpha;
    for (let i = 0; i < particle.points.length; i++) {
      ctx.fillRect(particle.points[i].x, particle.points[i].y, 1, 1);
    }
  }
  // ctx.strokeRect(l.frame.x, l.frame.y, l.frame.width, l.frame.height);
  ctx.globalAlpha = 1;
};

export const drawObject = async (
  object: ContentObject,
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  guideRects?: Rect[],
  original?: boolean,
  isCropEnabled = false
) => {
  if (object.type === "image")
    await drawImage(object, ctx, canvasWidth, canvasHeight, guideRects, original, isCropEnabled);
  else if (object.type === "rectangle") await drawRectangle(object, ctx);
  else if (object.type === "ellipse") await drawEllipse(object, ctx);
  else if (object.type === "path") await drawPath(object, ctx);
  else if (object.type === "polygon") await drawPolygon(object, ctx);
  else if (object.type === "chalk") await drawChalkObject(object, ctx);
  else if (object.type === "pen") await drawPenObject(object, ctx);
  else if (object.type === "highlighter") await drawHighlighterObject(object, ctx);
  else if (object.type === "pencil") await drawPencilObject(object, ctx);
  else if (object.type === "text") await drawText(object, ctx, canvasWidth, canvasHeight);
  else if (object.type === "freeform") await drawFreeform(object, ctx);
  else if (object.type === "arc") await drawArc(object, ctx);
};

export const drawCrosshair = (
  ctx: CanvasRenderingContext2D,
  center: Point,
  size: number = 5,
  lineColor: string = "blue",
  lineWidth: number = 1
) => {
  ctx.beginPath();
  ctx.moveTo(center.x - size, center.y);
  ctx.lineTo(center.x + size, center.y);
  ctx.moveTo(center.x, center.y - size);
  ctx.lineTo(center.x, center.y + size);
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
};
