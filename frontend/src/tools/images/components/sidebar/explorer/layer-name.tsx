import { useContextMenu } from "@images/hooks/common/use-context-menu";
import { Eye, EyeOff, PenIcon, ShareIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import EditableLabel from "../../ui/editable-label";
import { exportLayerToPng } from "@images/lib/export/export-png";
import { Rect } from "@images/types/geometry-types";
import { Layer } from "@images/types/layer-types";
import { rect2dim } from "@images/utils/math-utils";

interface LayerNameProps {
  layerId: string;
  layerName: string;
  isSelected: boolean;
  renameLayer: (name: string, layerId: string) => void;
  deleteLayer: (layerId: string) => void;
  layerFrame?: Rect;
  layer: Layer;
  toggleLayerVisibility: (layer: Layer) => void;
}

const LayerName = ({
  layerId,
  layerName,
  isSelected,
  renameLayer,
  deleteLayer,
  layer,
  layerFrame,
  toggleLayerVisibility,
}: LayerNameProps) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const { ContextMenu, handleContextMenu } = useContextMenu({
    renderMenu: closeMenu => (
      <div className="bg-white rounded shadow-lg">
        <button
          onClick={() => {
            setIsEditing(true);
            closeMenu();
          }}
          className="w-full flex items-center gap-2 text-left px-4 py-2 hover:bg-gray-100 rounded"
        >
          <PenIcon className="size-4" />
          Rename
        </button>
        <button
          onClick={() => {
            if (layerFrame)
              exportLayerToPng(layer, rect2dim(layerFrame)!, 1).then((data: File) => {
                const url = URL.createObjectURL(data);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${layerName}.png`;
                a.click();
                URL.revokeObjectURL(url);
              });
          }}
          className="w-full flex items-center gap-2 text-left px-4 py-2 hover:bg-gray-100"
        >
          <ShareIcon className="size-4" />
          Export
        </button>
        <button
          onClick={() => {
            deleteLayer(layerId);
            closeMenu();
          }}
          className="w-full flex items-center gap-2 text-left px-4 py-2 hover:bg-gray-100"
        >
          <TrashIcon className="size-4 text-red-500" />
          Delete
        </button>
      </div>
    ),
  });
  return (
    <div className="relative flex items-center group">
      <EditableLabel
        className="h-8 flex items-center cursor-pointer flex-1"
        isEditing={isEditing}
        onTextChange={name => {
          if (name) renameLayer(name, layerId);
        }}
        text={layerName}
        setIsEditing={setIsEditing}
        ContextMenu={ContextMenu}
        handleContextMenu={handleContextMenu}
      />
      <button
        onClick={e => {
          e.stopPropagation();
          toggleLayerVisibility(layer);
        }}
        className={`h-8 px-1 transition-opacity ${
          layer.hidden ? "opacity-100" : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        }`}
        title={layer.hidden ? "Show layer" : "Hide layer"}
      >
        {layer.hidden ? (
          <EyeOff className="size-4 text-gray-500" />
        ) : (
          <Eye className="size-4 text-gray-500" />
        )}
      </button>
    </div>
  );
};

export default LayerName;
