"use client";

import { ALL_FILTERS, getAllFilters, getFilterType } from "@images/constants/filter-constants";
import { useLayersContext } from "@images/context/layers/use-layers-context";
import { useUIContext } from "@images/context/ui/use-ui-context";
import { applyFilter } from "@images/lib/filters/filters";
import { drawObject } from "@images/lib/layers/render";
import { Filter } from "@images/types/filter-types";
import { Control } from "@images/types/ui-types";
import { generateId } from "@images/utils/object-utils";
import { ChevronLeft, FilterIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Button from "../ui/button";
import Dialog from "../ui/dialog/dialog";
import SliderWithLabels from "../ui/slider/slider-with-labels";

interface FiltersDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const FiltersDialog = ({ isOpen, onOpenChange }: FiltersDialogProps) => {
  const { layerOrders, layers, addLayer } = useLayersContext();
  const { layerFrame } = useUIContext();
  const layersList = Object.values(layers);
  const hasImageObject = layersList.some(
    layer => layer.objects && Object.values(layer.objects).some(obj => obj.type === "image")
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sampleCanvasRef = useRef<HTMLCanvasElement>(null);

  const [selectedFilterTitle, setSelectedFilterTitle] = useState<string | null>(null);
  const [filterParams, setFilterParams] = useState<Record<string, unknown>>({});

  // State to trigger re-render of sample previews when sample canvas is ready
  const [sampleCanvasReady, setSampleCanvasReady] = useState(0);

  // Memoize selectedFilter to prevent unnecessary recreations
  const selectedFilter = useMemo(
    () => (selectedFilterTitle ? getAllFilters().find(f => f.title === selectedFilterTitle) : null),
    [selectedFilterTitle]
  );

  // Draw sample canvas for card previews
  const drawSampleCanvas = useCallback(async () => {
    const canvas = sampleCanvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    if (!context || !canvas || !layerFrame) return;

    // Set a smaller size for sample previews
    const sampleWidth = 400;
    const sampleHeight = 300;
    canvas.width = sampleWidth;
    canvas.height = sampleHeight;

    // Clear canvas
    context.clearRect(0, 0, sampleWidth, sampleHeight);

    // Draw all existing layers (scaled down)
    const scaleX = sampleWidth / layerFrame.width;
    const scaleY = sampleHeight / layerFrame.height;
    context.save();
    context.scale(scaleX, scaleY);

    for (const layerId of layerOrders) {
      const layer = layers[layerId];
      if (layer.hidden) continue;
      const objectOrders = layer.objectOrders;
      if (!objectOrders) continue;

      if (layer.type === "content") {
        for (const objectId of objectOrders) {
          const object = layer.objects?.[objectId];
          if (!object || object.hidden) continue;
          await drawObject(object, context, layerFrame.width, layerFrame.height);
        }
      } else if (layer.type === "adjustment") {
        for (const objectId of objectOrders) {
          const object = layer.objects?.[objectId];
          if (!object) continue;
          const { applyAdjustment } = await import("@images/lib/adjustments/adjustments");
          applyAdjustment(object, context, layerFrame.width, layerFrame.height);
        }
      } else if (layer.type === "filter") {
        for (const objectId of objectOrders) {
          const object = layer.objects?.[objectId];
          if (!object) continue;
          applyFilter(object as Filter, context, canvas.width, canvas.height);
        }
      }
    }

    context.restore();

    // Trigger re-render of sample preview components
    setSampleCanvasReady(prev => prev + 1);
  }, [layerOrders, layers, layerFrame]);

  // Redraw canvas whenever selected filter or params change
  const drawCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    if (!context || !canvas || !layerFrame) return;

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all existing layers
    for (const layerId of layerOrders) {
      const layer = layers[layerId];
      if (layer.hidden) continue;
      const objectOrders = layer.objectOrders;
      if (!objectOrders) continue;

      if (layer.type === "content") {
        for (const objectId of objectOrders) {
          const object = layer.objects?.[objectId];
          if (!object || object.hidden) continue;
          await drawObject(object, context, canvas.width, canvas.height);
        }
      } else if (layer.type === "adjustment") {
        for (const objectId of objectOrders) {
          const object = layer.objects?.[objectId];
          if (!object) continue;
          const { applyAdjustment } = await import("@images/lib/adjustments/adjustments");
          applyAdjustment(object, context, canvas.width, canvas.height);
        }
      } else if (layer.type === "filter") {
        for (const objectId of objectOrders) {
          const object = layer.objects?.[objectId];
          if (!object) continue;
          applyFilter(object as Filter, context, layerFrame.width, layerFrame.height);
        }
      }
    }

    // Apply selected filter with current params
    if (selectedFilter) {
      const filterType = getFilterType(selectedFilter.title);
      if (filterType) {
        const filterObj: Filter = {
          id: "preview",
          category: "filter",
          type: filterType,
          ...(filterParams as any),
        };
        applyFilter(filterObj, context, canvas.width, canvas.height);
      }
    }
  }, [layerOrders, layers, layerFrame, selectedFilter, filterParams]);

  useEffect(() => {
    if (isOpen && layerFrame) {
      // Small delay to ensure canvas is mounted
      const timer = setTimeout(async () => {
        await Promise.all([drawCanvas(), drawSampleCanvas()]);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, layerFrame, drawCanvas, drawSampleCanvas]);

  // Redraw when layers or selected filter change
  useEffect(() => {
    if (isOpen) {
      if (selectedFilter) {
        // drawCanvas();
      } else {
        drawSampleCanvas();
      }
    }
  }, [layers, layerOrders, selectedFilter, filterParams, isOpen, drawCanvas, drawSampleCanvas]);

  const handleFilterSelect = useCallback((filterTitle: string) => {
    setSelectedFilterTitle(filterTitle);
    // Reset params to default values
    const filter = getAllFilters().find(f => f.title === filterTitle);
    const defaultParams: Record<string, unknown> = {};
    filter?.control.params.forEach(param => {
      if (param.type === "slider" && param.defaultValue !== undefined) {
        defaultParams[param.name] = param.defaultValue;
      }
    });
    setFilterParams(defaultParams);
  }, []);

  const handleParamChange = useCallback((paramName: string, value: unknown) => {
    setFilterParams(prev => ({
      ...prev,
      [paramName]: value,
    }));
  }, []);

  const handleApply = useCallback(() => {
    // Only create a layer if a filter is selected
    if (!selectedFilter) {
      onOpenChange(false);
      return;
    }

    const filterType = getFilterType(selectedFilter.title);
    if (!filterType) return;

    // Create a new filter layer with the selected filter
    const filterObject: Filter = {
      id: generateId(),
      category: "filter",
      type: filterType,
      ...(filterParams as any),
    };

    addLayer({
      id: generateId(),
      name: `${selectedFilter.title}-${Object.keys(layers).length + 1}`,
      type: "filter",
      objects: { [filterObject.id]: filterObject },
      objectOrders: [filterObject.id],
    });

    // Clear selection and close dialog
    setSelectedFilterTitle(null);
    setFilterParams({});
    onOpenChange(false);
  }, [selectedFilter, filterParams, addLayer, layers, onOpenChange]);

  const handleCancel = useCallback(() => {
    // If we're in detail view, discard and go back to grid view
    if (selectedFilterTitle) {
      setSelectedFilterTitle(null);
      setFilterParams({});
      return;
    }

    // In grid view, close dialog
    setSelectedFilterTitle(null);
    setFilterParams({});
    onOpenChange(false);
  }, [selectedFilterTitle, onOpenChange]);

  const handleBackToGrid = useCallback(() => {
    setSelectedFilterTitle(null);
    setFilterParams({});
  }, []);

  // Component for rendering a filter card
  const FilterCard = ({ filter }: { filter: Control }) => {
    return (
      <button
        onClick={() => handleFilterSelect(filter.title!)}
        className="flex flex-col gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all cursor-pointer bg-white"
      >
        {/* Filter Preview */}
        <div className="relative w-full h-40 border border-gray-200 rounded overflow-hidden bg-gray-50">
          <SamplePreview filter={filter} />
        </div>

        {/* Title */}
        <div className="text-sm font-medium text-center">{filter.title}</div>
      </button>
    );
  };

  // Component for rendering sample preview with filter applied
  const SamplePreview = ({ filter }: { filter: Control }) => {
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      const canvas = previewCanvasRef.current;
      const sampleCanvas = sampleCanvasRef.current;
      const context = canvas?.getContext("2d", { willReadFrequently: true });
      if (!context || !canvas || !sampleCanvas) return;

      // Set size to match container
      canvas.width = 400; // Match card width
      canvas.height = 160; // h-40 = 160px

      // Copy from sample canvas
      context.drawImage(sampleCanvas, 0, 0, canvas.width, canvas.height);

      // Apply filter if provided
      if (filter.title) {
        const filterType = getFilterType(filter.title);
        if (filterType) {
          const filterObj: Filter = {
            id: "preview",
            category: "filter",
            type: filterType,
            ...(filterParams as any),
          };

          // Use default parameter values
          const defaultParams: Record<string, unknown> = {};
          filter.params.forEach(param => {
            if (param.type === "slider" && param.defaultValue !== undefined) {
              defaultParams[param.name] = param.defaultValue;
            }
          });

          applyFilter(filterObj, context, canvas.width, canvas.height);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter, sampleCanvasReady]);

    return <canvas ref={previewCanvasRef} className="w-full h-full object-cover" />;
  };

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Trigger
        className="p-1 rounded"
        isActive={isOpen}
        variant="plain"
        disabled={!hasImageObject}
      >
        <FilterIcon className="size-6" />
      </Dialog.Trigger>
      <Dialog.Content className="w-[90vw] max-w-5xl max-h-[90vh] flex flex-col shadow-lg border">
        <Dialog.Content.Header className="border-b">
          <div className="flex items-center gap-2">
            {selectedFilterTitle && (
              <button onClick={handleBackToGrid} className="p-1 hover:bg-gray-100 rounded">
                <ChevronLeft className="size-5" />
              </button>
            )}
            <h2 className="text-lg font-semibold">{selectedFilterTitle || "Filters"}</h2>
          </div>
        </Dialog.Content.Header>

        {/* Hidden sample canvas for generating previews */}
        <canvas ref={sampleCanvasRef} className="hidden" />

        <div className="flex-1 overflow-auto">
          {selectedFilterTitle ? (
            // Detail View - Show preview and filter controls
            <div className="flex flex-col h-full">
              {/* Canvas Preview */}
              <div className="flex-1 flex items-center justify-center bg-gray-100 min-h-[400px] p-4">
                {layerFrame && (
                  <canvas
                    ref={canvasRef}
                    width={layerFrame.width}
                    height={layerFrame.height}
                    className="max-w-full max-h-full object-contain"
                    style={{
                      width: "auto",
                      height: "auto",
                      maxWidth: "100%",
                      maxHeight: "100%",
                    }}
                  />
                )}
              </div>

              {/* Filter Controls */}
              <div className="border-t p-4 bg-white">
                {selectedFilter && selectedFilter.control.params.length > 0 ? (
                  <div className="max-w-md mx-auto space-y-2">
                    {selectedFilter.control.params.map(param => {
                      if (param.type === "slider") {
                        return (
                          <SliderWithLabels
                            key={param.name}
                            className="w-full"
                            min={param.min ?? 0}
                            max={param.max ?? 100}
                            value={(filterParams[param.name] as number) ?? param.defaultValue ?? 0}
                            step={param.step ?? 1}
                            label={param.label ?? param.name}
                            onChange={value => handleParamChange(param.name, value)}
                            resetValue={param.defaultValue ?? 0}
                          />
                        );
                      }
                      return null;
                    })}
                  </div>
                ) : (
                  <div className="text-center text-gray-600">
                    This filter has no adjustable parameters
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Grid View - Show all filter cards
            <div className="p-6">
              {ALL_FILTERS.map(section => (
                <div key={section.title} className="mb-8 last:mb-0">
                  <h3 className="text-base font-semibold mb-4 text-gray-700">{section.title}</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {section.controls.map(filter => (
                      <FilterCard key={filter.title} filter={filter} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Dialog.Content.Footer className="flex gap-2 justify-end border-t">
          <Button variant="cancel" onClick={handleCancel}>
            {selectedFilterTitle ? "Cancel" : "Close"}
          </Button>
          {selectedFilterTitle && (
            <Button variant="apply" onClick={handleApply}>
              Apply
            </Button>
          )}
        </Dialog.Content.Footer>
      </Dialog.Content>
    </Dialog>
  );
};

export default FiltersDialog;
