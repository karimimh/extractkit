import { Size } from "@images/types/geometry-types";
import {
  ArcObject,
  ChalkObject,
  EllipseObject,
  FreeformObject,
  HighlighterObject,
  ImageObject,
  Layer,
  ContentObject,
  PathObject,
  PencilObject,
  PenObject,
  RectangleObject,
  TextObject,
} from "@images/types/layer-types";
import { applyAdjustment } from "../adjustments/adjustments";
import { applyEnhancement } from "../enhacements/enhancements";
import { applyFilter } from "../filters/filters";
import {
  drawArc,
  drawChalkObject,
  drawEllipse,
  drawFreeform,
  drawHighlighterObject,
  drawImage,
  drawPath,
  drawPencilObject,
  drawPenObject,
  drawPolygon,
  drawRectangle,
  drawText,
} from "../layers/render";

export const exportObjectToPng = (object: ContentObject, size: Size): Promise<string> => {
  return new Promise(async resolve => {
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, size.width, size.height);
    if (object.type === "image") {
      await drawImage(object as ImageObject, context, size.width, size.height, [], false, false);
    } else if (object.type === "rectangle") {
      drawRectangle(object as RectangleObject, context);
    } else if (object.type === "ellipse") {
      drawEllipse(object as EllipseObject, context);
    } else if (object.type === "polygon") {
      drawPolygon(object as PathObject, context);
    } else if (object.type === "path") {
      drawPath(object as PathObject, context);
    } else if (object.type === "chalk") {
      drawChalkObject(object as ChalkObject, context);
    } else if (object.type === "freeform") {
      drawFreeform(object as FreeformObject, context);
    } else if (object.type === "text") {
      drawText(object as TextObject, context, size.width, size.height);
    } else if (object.type === "highlighter") {
      drawHighlighterObject(object as HighlighterObject, context);
    } else if (object.type === "pencil") {
      drawPencilObject(object as PencilObject, context);
    } else if (object.type === "pen") {
      drawPenObject(object as PenObject, context);
    } else if (object.type === "arc") {
      drawArc(object as ArcObject, context);
    }
    resolve(canvas.toDataURL("image/png", 1.0));
  });
};

export const exportLayerToPng = (layer: Layer, size: Size, scale: number): Promise<File> => {
  return new Promise(async resolve => {
    const canvas = document.createElement("canvas");
    canvas.width = size.width * scale;
    canvas.height = size.height * scale;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(scale, scale);
    context.clearRect(0, 0, size.width, size.height);
    for (const objectId of layer.objectOrders ?? []) {
      const object = layer.objects?.[objectId];
      if (!object) continue;
      if (object.type === "image") {
        await drawImage(object as ImageObject, context, size.width, size.height, [], false, false);
      } else if (object.type === "rectangle") {
        drawRectangle(object as RectangleObject, context);
      } else if (object.type === "ellipse") {
        drawEllipse(object as EllipseObject, context);
      } else if (object.type === "polygon") {
        drawPolygon(object as PathObject, context);
      } else if (object.type === "path") {
        drawPath(object as PathObject, context);
      } else if (object.type === "chalk") {
        drawChalkObject(object as ChalkObject, context);
      } else if (object.type === "freeform") {
        drawFreeform(object as FreeformObject, context);
      } else if (object.type === "text") {
        drawText(object as TextObject, context, size.width, size.height);
      } else if (object.type === "highlighter") {
        drawHighlighterObject(object as HighlighterObject, context);
      } else if (object.type === "pencil") {
        drawPencilObject(object as PencilObject, context);
      } else if (object.type === "pen") {
        drawPenObject(object as PenObject, context);
      } else if (object.type === "arc") {
        drawArc(object as ArcObject, context);
      }
    }

    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], `${layer.name}.png`, { type: "image/png" });
      resolve(file);
    }, "image/png");
  });
};

export const exportLayersToPng = (
  layers: {
    [id: string]: Layer;
  },
  layerOrders: string[],
  size: Size,
  scale: number
): Promise<File> => {
  return new Promise(async resolve => {
    const canvas = document.createElement("canvas");
    canvas.width = size.width * scale;
    canvas.height = size.height * scale;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(scale, scale);
    context.clearRect(0, 0, size.width, size.height);
    for (const layerId of layerOrders) {
      const layer = layers[layerId];
      if (!layer || layer.hidden) continue;

      if (layer.type === "content") {
        for (const objectId of layer.objectOrders ?? []) {
          const object = layer.objects?.[objectId];
          if (!object) continue;
          if (object.type === "image") {
            await drawImage(
              object as ImageObject,
              context,
              size.width,
              size.height,
              [],
              false,
              false
            );
          } else if (object.type === "rectangle") {
            drawRectangle(object as RectangleObject, context);
          } else if (object.type === "ellipse") {
            drawEllipse(object as EllipseObject, context);
          } else if (object.type === "polygon") {
            drawPolygon(object as PathObject, context);
          } else if (object.type === "path") {
            drawPath(object as PathObject, context);
          } else if (object.type === "chalk") {
            drawChalkObject(object as ChalkObject, context);
          } else if (object.type === "freeform") {
            drawFreeform(object as FreeformObject, context);
          } else if (object.type === "text") {
            drawText(object as TextObject, context, size.width, size.height);
          } else if (object.type === "highlighter") {
            drawHighlighterObject(object as HighlighterObject, context);
          } else if (object.type === "pencil") {
            drawPencilObject(object as PencilObject, context);
          } else if (object.type === "pen") {
            drawPenObject(object as PenObject, context);
          } else if (object.type === "arc") {
            drawArc(object as ArcObject, context);
          }
        }
      } else if (layer.type === "adjustment") {
        for (const objectId of layer.objectOrders ?? []) {
          const object = layer.objects?.[objectId];
          if (!object) continue;
          applyAdjustment(object, context, size.width, size.height);
        }
      } else if (layer.type === "filter") {
        for (const objectId of layer.objectOrders ?? []) {
          const object = layer.objects?.[objectId];
          if (!object) continue;
          applyFilter(object, context, size.width, size.height, object);
        }
      } else if (layer.type === "enhancement") {
        for (const objectId of layer.objectOrders ?? []) {
          const object = layer.objects?.[objectId];
          if (!object) continue;
          applyEnhancement(object, context, size.width, size.height);
        }
      }
      // Note: colorization layers are not yet supported in export
    }

    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], "image.png", { type: "image/png" });
      resolve(file);
    }, "image/png");
  });
};
