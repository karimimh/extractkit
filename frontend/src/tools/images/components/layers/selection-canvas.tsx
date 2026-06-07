
import { Rect } from "@images/types/geometry-types";
import { ImageObject } from "@images/types/layer-types";
import { ToolType } from "@images/types/tool-types";
import CropLayer from "./crop/crop-layer";
import ImageCanvas from "./image-canvas";
import EllipseSelectionLayer from "./selection/ellipse-selection-layer";
import FreeformSelectionLayer from "./selection/freeform-selection-layer";
import PathSelectionLayer from "./selection/path-selection-layer";
import PolygonSelectionLayer from "./selection/polygon-selection-layer";
import RectangleSelectionLayer from "./selection/rectangle-selection-layer";
import { generateId } from "@images/utils/object-utils";

interface SelectionCanvasProps {
  layerFrame: Rect;
  selectedToolType: ToolType | undefined;
  firstmostImageObject?: ImageObject;
  isDiffButtonPressed?: boolean;
}

const SelectionCanvas = ({
  layerFrame,
  selectedToolType,
  firstmostImageObject,
  isDiffButtonPressed,
}: SelectionCanvasProps) => {
  const isSelectingRectangular = selectedToolType === "select-rectangle";
  const isSelectingFreeform = selectedToolType === "select-freeform";
  const isSelectingEllipse = selectedToolType === "select-ellipse";
  const isSelectingPolygon = selectedToolType === "select-polygon";
  const isSelectingPath = selectedToolType === "select-path";
  const isCropping = selectedToolType === "crop";

  return (
    <>
      {isSelectingRectangular && (
        <RectangleSelectionLayer layerFrame={layerFrame} />
      )}
      {isSelectingEllipse && <EllipseSelectionLayer layerFrame={layerFrame} />}
      {isSelectingPolygon && <PolygonSelectionLayer layerFrame={layerFrame} />}
      {isSelectingPath && <PathSelectionLayer layerFrame={layerFrame} />}
      {isSelectingFreeform && (
        <FreeformSelectionLayer layerFrame={layerFrame} />
      )}
      {isCropping && <CropLayer layerFrame={layerFrame} />}
      {isDiffButtonPressed && firstmostImageObject && (
        <ImageCanvas
          layerFrame={layerFrame}
          object={firstmostImageObject}
          original
          layerId={generateId()}
        />
      )}
    </>
  );
};

export default SelectionCanvas;
