import { Size } from "@images/types/geometry-types";
import { TextProperties } from "@images/types/layer-types";

export function measureTextSize(
  textProps: TextProperties,
  layerFrame: Size
): Size {
  const { content, fontFamily = "Arial", fontSize = 16 } = textProps;

  const canvas = document.createElement("canvas");
  canvas.width = layerFrame.width;
  canvas.height = layerFrame.height;
  const ctx = canvas.getContext("2d")!;

  ctx.font = `${fontSize}px ${fontFamily}`;

  const lines = content.split("\n");
  const lineHeight = fontSize ?? 16;

  let width = 0;
  let height = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineMetrics = ctx.measureText(line);
    width = Math.max(width, lineMetrics.width);
    height += lineHeight;
  }

  return { width, height };
}
