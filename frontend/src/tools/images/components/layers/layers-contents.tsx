import { useLayersContext } from "@images/context/layers/use-layers-context";
import { useUIContext } from "@images/context/ui/use-ui-context";
import { Point, Rect } from "@images/types/geometry-types";
import { generateId } from "@images/utils/object-utils";
import ArcCanvas from "./draw/arc-canvas";
import ChalkCanvas from "./draw/chalk-canvas";
import EllipseCanvas from "./draw/ellipse-canvas";
import HighlighterCanvas from "./draw/highlighter-canvas";
import PathCanvas from "./draw/path-canvas";
import PenCanvas from "./draw/pen-canvas";
import PencilCanvas from "./draw/pencil-canvas";
import PolygonCanvas from "./draw/polygon-canvas";
import RectangleCanvas from "./draw/rectangle-canvas";
import Grid from "./grid";
import LayersCanvas from "./layers-canvas";
import MouseCoordinatesLabel from "./mouse-coordinates-label";
import ObjectModifier from "./object-modifier";

interface LayersContentsProps {
  mousePosition?: Point;
  layerFrame: Rect;
}

const LayersContents = ({ layerFrame, mousePosition }: LayersContentsProps) => {
  const { selectedTool, grid, isSnapEnabled } = useUIContext();
  const { modifyObject, addLayer, layerOrders } = useLayersContext();

  return (
    <>
      <Grid layerFrame={layerFrame} />
      <LayersCanvas layerFrame={layerFrame} />
      {!selectedTool && (
        <ObjectModifier
          layerFrame={layerFrame}
          mousePosition={mousePosition}
          onChange={modifyObject}
          grid={isSnapEnabled ? grid : undefined}
        />
      )}
      {selectedTool?.type === "rectangle" ? (
        <RectangleCanvas
          layerFrame={layerFrame}
          onNewObject={obj => {
            addLayer({
              id: generateId(),
              name: `Layer-${layerOrders.length + 1}`,
              type: "content",
              objectOrders: [obj.id],
              objects: { [obj.id]: obj },
            });
          }}
          isSnapEnabled={isSnapEnabled}
          grid={isSnapEnabled ? grid : undefined}
        />
      ) : selectedTool?.type === "ellipse" ? (
        <EllipseCanvas
          layerFrame={layerFrame}
          onNewObject={obj => {
            addLayer({
              id: generateId(),
              name: `Layer-${layerOrders.length + 1}`,
              type: "content",
              objectOrders: [obj.id],
              objects: { [obj.id]: obj },
            });
          }}
          isSnapEnabled={isSnapEnabled}
          grid={isSnapEnabled ? grid : undefined}
        />
      ) : selectedTool?.type === "path" ? (
        <PathCanvas
          layerFrame={layerFrame}
          onNewObject={obj => {
            addLayer({
              id: generateId(),
              name: `Layer-${layerOrders.length + 1}`,
              type: "content",
              objectOrders: [obj.id],
              objects: { [obj.id]: obj },
            });
          }}
          isSnapEnabled={isSnapEnabled}
          grid={isSnapEnabled ? grid : undefined}
        />
      ) : selectedTool?.type === "arc" ? (
        <ArcCanvas
          layerFrame={layerFrame}
          onNewObject={obj => {
            addLayer({
              id: generateId(),
              name: `Layer-${layerOrders.length + 1}`,
              type: "content",
              objectOrders: [obj.id],
              objects: { [obj.id]: obj },
            });
          }}
          isSnapEnabled={isSnapEnabled}
          grid={isSnapEnabled ? grid : undefined}
        />
      ) : selectedTool?.type === "chalk" ? (
        <ChalkCanvas
          layerFrame={layerFrame}
          onNewObject={obj => {
            addLayer({
              id: generateId(),
              name: `Layer-${layerOrders.length + 1}`,
              type: "content",
              objectOrders: [obj.id],
              objects: { [obj.id]: obj },
            });
          }}
          isSnapEnabled={isSnapEnabled}
          grid={isSnapEnabled ? grid : undefined}
        />
      ) : selectedTool?.type === "pen" ? (
        <PenCanvas
          layerFrame={layerFrame}
          onNewObject={obj => {
            addLayer({
              id: generateId(),
              name: `Layer-${layerOrders.length + 1}`,
              type: "content",
              objectOrders: [obj.id],
              objects: { [obj.id]: obj },
            });
          }}
          isSnapEnabled={isSnapEnabled}
          grid={isSnapEnabled ? grid : undefined}
        />
      ) : selectedTool?.type === "pencil" ? (
        <PencilCanvas
          layerFrame={layerFrame}
          onNewObject={obj => {
            addLayer({
              id: generateId(),
              name: `Layer-${layerOrders.length + 1}`,
              type: "content",
              objectOrders: [obj.id],
              objects: { [obj.id]: obj },
            });
          }}
          isSnapEnabled={isSnapEnabled}
          grid={isSnapEnabled ? grid : undefined}
        />
      ) : selectedTool?.type === "highlighter" ? (
        <HighlighterCanvas
          layerFrame={layerFrame}
          onNewObject={obj => {
            addLayer({
              id: generateId(),
              name: `Layer-${layerOrders.length + 1}`,
              type: "content",
              objectOrders: [obj.id],
              objects: { [obj.id]: obj },
            });
          }}
          isSnapEnabled={isSnapEnabled}
          grid={isSnapEnabled ? grid : undefined}
        />
      ) : selectedTool?.type === "polygon" ? (
        <PolygonCanvas
          layerFrame={layerFrame}
          onNewObject={obj => {
            addLayer({
              id: generateId(),
              name: `Layer-${layerOrders.length + 1}`,
              type: "content",
              objectOrders: [obj.id],
              objects: { [obj.id]: obj },
            });
          }}
          isSnapEnabled={isSnapEnabled}
          grid={isSnapEnabled ? grid : undefined}
        />
      ) : null}
      {mousePosition !== undefined && <MouseCoordinatesLabel position={mousePosition} />}
    </>
  );
};

export default LayersContents;
