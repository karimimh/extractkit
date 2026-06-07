import { useContextMenu } from "@images/hooks/common/use-context-menu";
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
} from "@images/lib/layers/render";
import { Rect } from "@images/types/geometry-types";
import {
  ArcObject,
  ChalkObject,
  ContentObject,
  EllipseObject,
  FreeformObject,
  HighlighterObject,
  ImageObject,
  PathObject,
  PencilObject,
  PenObject,
  RectangleObject,
  TextObject,
} from "@images/types/layer-types";
import { ChevronRight, Trash } from "lucide-react";
import { useEffect, useState } from "react";

interface ContentObjectListItemProps {
  object: ContentObject;
  layerFrame?: Rect;
  deleteObject: () => void;
  onObjectSelect: () => void;
}

const ContentObjectListItem = ({
  layerFrame = { x: 0, y: 0, width: 0, height: 0 },
  object,
  deleteObject,
  onObjectSelect,
}: ContentObjectListItemProps) => {
  const getObjectName = (object?: ContentObject) => {
    if (!object) return;
    if (object.type === "rectangle") {
      return `Rectangle`;
    } else if (object.type === "image") {
      return `Image`;
    } else if (object.type === "text") {
      return `Text`;
    } else if (object.type === "ellipse") {
      return `Ellipse`;
    } else if (object.type === "path") {
      return `Path`;
    } else if (object.type === "polygon") {
      return `Polygon`;
    } else if (object.type === "chalk") {
      return `Chalk`;
    } else if (object.type === "freeform") {
      return `Freeform`;
    } else if (object.type === "arc") {
      return `Arc`;
    } else {
      return `Object`;
    }
  };

  // Generate preview asynchronously using useState and useEffect
  const [preview, setPreview] = useState<string | undefined>(undefined);

  useEffect(() => {
    const generatePreview = async () => {
      const canvas = document.createElement("canvas");
      const size = 64; // Fixed thumbnail size
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");

      if (!context) return undefined;

      // Save context state
      context.save();

      context.clearRect(0, 0, size, size);

      // Calculate scaling to fit object in thumbnail while maintaining aspect ratio
      const objectWidth = layerFrame.width || size;
      const objectHeight = layerFrame.height || size;
      const scale = Math.min(size / objectWidth, size / objectHeight);

      // Center the object in the thumbnail
      const offsetX = (size - objectWidth * scale) / 2;
      const offsetY = (size - objectHeight * scale) / 2;

      context.translate(offsetX, offsetY);
      context.scale(scale, scale);

      // Create a simplified preview (synchronous rendering only)
      if (object.type === "image") {
        await drawImage(object as ImageObject, context, size, size, [], false, false);
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
        drawText(object as TextObject, context, size, size);
      } else if (object.type === "highlighter") {
        drawHighlighterObject(object as HighlighterObject, context);
      } else if (object.type === "pencil") {
        drawPencilObject(object as PencilObject, context);
      } else if (object.type === "pen") {
        drawPenObject(object as PenObject, context);
      } else if (object.type === "arc") {
        drawArc(object as ArcObject, context);
      }

      // Restore context state
      context.restore();

      return canvas.toDataURL("image/png", 0.8);
    };

    generatePreview().then(setPreview);
  }, [object, layerFrame.width, layerFrame.height]);

  const { ContextMenu, handleContextMenu } = useContextMenu({
    renderMenu: closeMenu => (
      <div className="bg-white border rounded shadow-md">
        <button
          onClick={() => {
            deleteObject();
            closeMenu();
          }}
          className="w-full flex items-center gap-2 text-left px-4 py-2 hover:bg-gray-100"
        >
          <Trash className="size-4 text-red-500" />
          Delete
        </button>
      </div>
    ),
  });

  return (
    <>
      <div className="flex items-center gap-2 pl-6 pr-2 py-1" onContextMenu={handleContextMenu}>
        <div className="w-6 h-6 relative bg-white">
          {preview && (
            <img
              src={preview}
              alt={object.id}
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
            />
          )}
        </div>
        <div className="flex-1 flex items-center">{`${getObjectName(object)}`}</div>
        {/* {isHidden ? (
          <EyeOff className="size-4 text-gray-500" onClick={() => onHiddenChange?.(false)} />
        ) : (
          <Eye className="size-4 text-gray-500" onClick={() => onHiddenChange?.(true)} />
        )} */}
        <ChevronRight className="size-4" onClick={onObjectSelect} />
      </div>
      {ContextMenu}
    </>
  );
};

export default ContentObjectListItem;
