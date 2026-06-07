import { useLayersContext } from "@images/context/layers/use-layers-context";
import { Point, Rect } from "@images/types/geometry-types";
import { ContentObject, LayerObject } from "@images/types/layer-types";
import { cn } from "@images/utils/css-utils";
import {
  calculateEditedFrame,
  getPointArea,
  layerObjectContainsPoint,
  PointArea,
} from "@images/utils/geometry-utils";
import { snapRectToGrid } from "@images/utils/grid-utils";
import { deepCopy } from "@images/utils/object-utils";
import { parseInteger, scalePoint } from "@images/utils/ui-utils";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface ObjectModifierProps {
  mousePosition?: Point;
  layerFrame: Rect;
  grid?: {
    rows: number;
    columns: number;
  };
  onChange: (layerId: string, object: LayerObject) => void;
}

const ObjectModifier = ({ layerFrame, mousePosition, grid, onChange }: ObjectModifierProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { layerOrders, layers } = useLayersContext();
  const [hoveredObjectId, setHoveredObjectId] = useState<string | undefined>();
  const [hoveredLayerId, setHoveredLayerId] = useState<string | undefined>();
  const editAction = useRef<PointArea | undefined>(undefined);
  const startingFrame = useRef<Rect>(undefined);
  const startingPoint = useRef<Point>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [hoveredAction, setHoveredAction] = useState<PointArea | undefined>();
  const [frame, setFrame] = useState<Rect | undefined>();
  const startingObject = useRef<ContentObject | undefined>();

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvasFrame = canvasRef.current?.getBoundingClientRect();
    if (!canvasFrame || !mousePosition) return;
    const point = scalePoint({ x: event.clientX, y: event.clientY }, canvasFrame, layerFrame);
    if (!isEditing) {
      // find the hoveredObject
      for (let i = layerOrders.length - 1; i >= 0; i--) {
        const layerId = layerOrders[i];
        const layer = layers[layerId];
        const objectOrders = layer.objectOrders ?? [];
        for (let j = objectOrders.length - 1; j >= 0; j--) {
          const objectId = objectOrders[j];
          const object = layer.objects?.[objectId];
          if (!object || object.hidden || object.type === "image") continue;
          const containsPoint = layerObjectContainsPoint(object, mousePosition);
          if (containsPoint) {
            const f = object.frame;
            setFrame(f);
            startingObject.current = deepCopy(object);
            if (f) setHoveredAction(getPointArea(point, f));
            setHoveredObjectId(objectId);
            setHoveredLayerId(layerId);
            return;
          }
        }
      }
      setHoveredObjectId(undefined);
      setHoveredLayerId(undefined);
      startingObject.current = undefined;
      setFrame(undefined);
    } else {
      if (!frame || !hoveredLayerId || !hoveredObjectId) return;

      const layer = layers[hoveredLayerId];
      const object = layer.objects?.[hoveredObjectId];
      if (!object) return;
      if (!startingPoint.current || !startingFrame.current) return;
      let newFrame = calculateEditedFrame(
        startingFrame.current,
        startingPoint.current,
        point,
        editAction.current
      );
      if (newFrame) {
        const snappedFrame = snapRectToGrid(newFrame, layerFrame.width, layerFrame.height, grid);
        newFrame = parseInteger(snappedFrame);
      }

      if (!newFrame) return;
      onChange(hoveredLayerId, { ...object, frame: newFrame });

      if (object.type === "ellipse") {
        onChange(hoveredLayerId, {
          ...object,
          center: {
            x: newFrame.x + newFrame.width / 2,
            y: newFrame.y + newFrame.height / 2,
          },
        });
        onChange(hoveredLayerId, { ...object, radiusX: newFrame.width / 2 });
        onChange(hoveredLayerId, { ...object, radiusY: newFrame.height / 2 });
      } else if (object.type === "path" || object.type === "polygon" || object.type === "arc") {
        if (
          startingObject.current?.type !== "path" &&
          startingObject.current?.type !== "polygon" &&
          startingObject.current?.type !== "arc"
        )
          return;
        const p1: Point = { x: newFrame.x, y: newFrame.y };
        const translation: Point = { x: newFrame.x - frame.x, y: newFrame.y - frame.y };
        const scale: Point = {
          x: newFrame.width / frame.width,
          y: newFrame.height / frame.height,
        };
        const newPoints = startingObject.current.points.map(point => ({
          x: p1.x + scale.x * (point.x + translation.x - p1.x),
          y: p1.y + scale.y * (point.y + translation.y - p1.y),
        }));
        onChange(hoveredLayerId, { ...object, points: newPoints });
      } else if (object.type === "pen" || object.type === "highlighter") {
        if (
          startingObject.current?.type !== "pen" &&
          startingObject.current?.type !== "highlighter"
        )
          return;

        const p1: Point = { x: newFrame.x, y: newFrame.y };
        const translation: Point = { x: newFrame.x - frame.x, y: newFrame.y - frame.y };
        const scale: Point = {
          x: newFrame.width / frame.width,
          y: newFrame.height / frame.height,
        };
        const newParticles = startingObject.current.particles.map(particle => ({
          ...particle,
          center: {
            x: p1.x + scale.x * (particle.center.x + translation.x - p1.x),
            y: p1.y + scale.y * (particle.center.y + translation.y - p1.y),
          },
        }));
        onChange(hoveredLayerId, { ...object, particles: newParticles });
      } else if (object.type === "chalk" || object.type === "pencil") {
        if (startingObject.current?.type !== "chalk" && startingObject.current?.type !== "pencil")
          return;
        const p1: Point = { x: newFrame.x, y: newFrame.y };
        const translation: Point = { x: newFrame.x - frame.x, y: newFrame.y - frame.y };
        const scale: Point = {
          x: newFrame.width / frame.width,
          y: newFrame.height / frame.height,
        };
        const newParticles = startingObject.current.particles.map(particle => ({
          ...particle,
          points: particle.points.map(point => ({
            x: p1.x + scale.x * (point.x + translation.x - p1.x),
            y: p1.y + scale.y * (point.y + translation.y - p1.y),
          })),
        }));
        onChange(hoveredLayerId, { ...object, particles: newParticles });
      }
    }
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isEditing) {
      return;
    }
    const canvasFrame = canvasRef.current?.getBoundingClientRect();
    if (!canvasFrame || !frame) return;
    const point = scalePoint({ x: event.clientX, y: event.clientY }, canvasFrame, layerFrame);
    const area = getPointArea(point, frame);
    if (area) {
      editAction.current = area;
      startingFrame.current = { ...frame };
      startingPoint.current = point;
      setIsEditing(true);
    }
  };

  const handleMouseUp = () => {
    if (isEditing) {
      setIsEditing(false);
      return;
    }
  };

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!hoveredLayerId || !hoveredObjectId) return;
    const layer = layers[hoveredLayerId];
    const frame = layer.objects?.[hoveredObjectId].frame;
    if (!frame) return;
    ctx.strokeStyle = "#0000ee";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(frame.x, frame.y, frame.width, frame.height);
  }, [hoveredLayerId, hoveredObjectId, layers]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      className={cn(
        "absolute top-0 left-0 w-full h-full",
        hoveredAction === "move" && "cursor-move",
        hoveredAction === "top-resize" && "cursor-ns-resize",
        hoveredAction === "bottom-resize" && "cursor-ns-resize",
        hoveredAction === "left-resize" && "cursor-ew-resize",
        hoveredAction === "right-resize" && "cursor-ew-resize",
        hoveredAction === "top-left-resize" && "cursor-nwse-resize",
        hoveredAction === "top-right-resize" && "cursor-nesw-resize",
        hoveredAction === "bottom-left-resize" && "cursor-nesw-resize",
        hoveredAction === "bottom-right-resize" && "cursor-nwse-resize"
      )}
      ref={canvasRef}
      width={layerFrame.width}
      height={layerFrame.height}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
};

export default ObjectModifier;
