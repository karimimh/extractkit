import { useLayersContext } from "@images/context/layers/use-layers-context";
import { useUIContext } from "@images/context/ui/use-ui-context";
import { ContentObject, Layer } from "@images/types/layer-types";
import { cn } from "@images/utils/css-utils";
import { Plus } from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";
import Accordion from "../../ui/accordion";
import Button from "../../ui/button";
import AdjustmentObjectListItem from "./adjustment-object-list-item";
import ColorizationListItem from "./colorization-list-item";
import ContentObjectListItem from "./content-object-list-item";
import LayerName from "./layer-name";
import { generateId } from "@images/utils/object-utils";

interface LayersListProps {
  onObjectSelect: (layerId?: string, objectId?: string) => void;
  openIndices: number[];
  setOpenIndices: Dispatch<SetStateAction<number[]>>;
}

export default function LayersList({
  onObjectSelect,
  openIndices,
  setOpenIndices,
}: LayersListProps) {
  const {
    layers,
    layerOrders,
    selectedLayerId,
    selectedObjectId,
    addLayer,
    renameLayer,
    deleteLayer,
    swapLayers,
    selectLayer,
    modifyObject,
    modifyLayer,
  } = useLayersContext();

  const { layerFrame } = useUIContext();

  const [srcLayerId, setSrcLayerId] = useState<string>();

  const handleLayerDragStart = (layerId: string) => {
    setSrcLayerId(layerId);
  };

  const handleLayerDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleLayerDrop = (e: React.DragEvent<HTMLDivElement>, layerId: string) => {
    if (srcLayerId && layerId) {
      swapLayers(srcLayerId, layerId);
    }
  };

  const handleLayerDragEnd = () => {
    setSrcLayerId(undefined);
  };

  const toggleLayerVisibility = (layer: Layer) => {
    modifyLayer({
      ...layer,
      hidden: !layer.hidden,
    });
  };

  return (
    <div className="w-full flex flex-col pb-8 text-black">
      <div className="flex h-10 w-full items-center justify-normal gap-2 border-b pb-1 px-4">
        <h2 className="sm:ml-8 text-lg font-bold text-left">Layers</h2>
        <Button
          icon={Plus}
          className="h-7"
          variant="plain"
          onClick={() =>
            addLayer({
              name: `layer-${layerOrders.length + 1}`,
              id: generateId(),
              type: "content",
            })
          }
        />
      </div>
      <div className="flex-1 w-full overflow-y-auto">
        <Accordion openIndices={openIndices} setOpenIndices={setOpenIndices}>
          {layerOrders.map((layerId, index) => {
            const { name: layerName, objectOrders, objects } = layers[layerId];
            return (
              <Accordion.Item key={layerId}>
                <Accordion.Item.Trigger
                  className={cn(
                    "px-2",
                    layerId === selectedLayerId &&
                      (!openIndices.includes(index) ||
                        !objectOrders?.includes(selectedObjectId ?? "")) &&
                      "bg-[#E4E6F1]"
                  )}
                  expandable={(objectOrders?.length ?? 0) !== 0}
                >
                  <div
                    draggable
                    onClick={() => selectLayer(layerId)}
                    onDragEnd={handleLayerDragEnd}
                    onDragOver={handleLayerDragOver}
                    onDragStart={() => handleLayerDragStart(layerId)}
                    onDrop={e => handleLayerDrop(e, layerId)}
                  >
                    <LayerName
                      isSelected={layerId === selectedLayerId}
                      layerId={layerId}
                      layerName={layerName}
                      renameLayer={renameLayer}
                      deleteLayer={deleteLayer}
                      layer={layers[layerId]}
                      layerFrame={layerFrame}
                      toggleLayerVisibility={toggleLayerVisibility}
                    />
                  </div>
                </Accordion.Item.Trigger>
                <Accordion.Item.Content className="flex flex-col gap-1 relative">
                  {objectOrders?.map(objectId => {
                    const object = objects?.[objectId];
                    if (!object) return null;
                    if (object.category === "content")
                      return (
                        <div
                          className={cn(
                            "pl-2 cursor-pointer",
                            objectId === selectedObjectId && "bg-[#E4E6F1]"
                          )}
                          key={objectId}
                          draggable
                          onClick={() => {}}
                        >
                          <ContentObjectListItem
                            object={objects[objectId] as ContentObject}
                            layerFrame={layerFrame}
                            deleteObject={() => {}}
                            onObjectSelect={() => onObjectSelect(layerId, objectId)}
                          />
                        </div>
                      );
                    else if (object.category === "adjustment") {
                      return (
                        <AdjustmentObjectListItem
                          key={objectId}
                          object={object}
                          onValueChange={value => modifyObject(layerId, { ...object, value })}
                        />
                      );
                    } else if (object.category === "colorization") {
                      return <ColorizationListItem key={objectId} object={object} />;
                    }
                    return null;
                  })}
                  <div className="h-full absolute top-0 left-4 w-[1px] bg-gray-400" />
                </Accordion.Item.Content>
              </Accordion.Item>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}
