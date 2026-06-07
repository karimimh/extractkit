"use client";

import { getAllAdjustmentParams, getAdjustmentsBySection } from "@images/constants/adjustment-constants";
import { useLayersContext } from "@images/context/layers/use-layers-context";
import { useUIContext } from "@images/context/ui/use-ui-context";
import { applyAdjustment } from "@images/lib/adjustments/adjustments";
import { drawObject } from "@images/lib/layers/render";
import { Adjustment } from "@images/types/adjustment-types";
import { Param } from "@images/types/ui-types";
import { generateId } from "@images/utils/object-utils";
import { ArrowRight, ChevronLeft, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Button from "../ui/button";
import Dialog from "../ui/dialog/dialog";
import SliderWithLabels from "../ui/slider/slider-with-labels";

interface AdjustmentsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const AdjustmentsDialog = ({ isOpen, onOpenChange }: AdjustmentsDialogProps) => {
  const { layerOrders, layers, addLayer } = useLayersContext();
  const { layerFrame } = useUIContext();
  const layersList = Object.values(layers);
  const hasImageObject = layersList.some(
    layer => layer.objects && Object.values(layer.objects).some(obj => obj.type === "image")
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sampleCanvasRef = useRef<HTMLCanvasElement>(null);

  // Local state for adjustments that will be applied on confirm
  const [pendingAdjustments, setPendingAdjustments] = useState<Record<string, Adjustment>>({});

  // State to track which adjustment is currently selected (null = grid view)
  const [selectedAdjustment, setSelectedAdjustment] = useState<string | null>(null);

  // State to trigger re-render of sample previews when sample canvas is ready
  const [sampleCanvasReady, setSampleCanvasReady] = useState(0);

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
          applyAdjustment(object, context, layerFrame.width, layerFrame.height);
        }
      }
    }

    context.restore();

    // Trigger re-render of sample preview components
    setSampleCanvasReady(prev => prev + 1);
  }, [layerOrders, layers, layerFrame]);

  // Redraw canvas whenever pending adjustments change
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
          applyAdjustment(object, context, canvas.width, canvas.height);
        }
      }
    }

    // Apply pending adjustments on top (only the selected one in detail view)
    if (selectedAdjustment && pendingAdjustments[selectedAdjustment]) {
      applyAdjustment(pendingAdjustments[selectedAdjustment], context, canvas.width, canvas.height);
    }
  }, [layerOrders, layers, pendingAdjustments, selectedAdjustment, layerFrame]);

  useEffect(() => {
    if (isOpen && layerFrame) {
      // Small delay to ensure canvas is mounted
      const timer = setTimeout(async () => {
        await Promise.all([drawCanvas(), drawSampleCanvas()]);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, layerFrame, drawCanvas, drawSampleCanvas]);

  // Redraw when layers or pending adjustments change
  useEffect(() => {
    if (isOpen) {
      if (selectedAdjustment) {
        drawCanvas();
      } else {
        drawSampleCanvas();
      }
    }
  }, [
    layers,
    layerOrders,
    pendingAdjustments,
    selectedAdjustment,
    isOpen,
    drawCanvas,
    drawSampleCanvas,
  ]);

  const handleAdjustmentChange = useCallback((adjType: string, value: number) => {
    setPendingAdjustments(prev => {
      // If value is at initial value, remove the adjustment
      const adjConfig = getAllAdjustmentParams().find(adj => adj.name === adjType);

      if (adjConfig && adjConfig.type === "slider" && value === adjConfig.defaultValue) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [adjType]: _, ...rest } = prev;
        return rest;
      }

      // Otherwise update or add the adjustment
      return {
        ...prev,
        [adjType]: {
          id: prev[adjType]?.id || generateId(),
          category: "adjustment",
          type: adjType,
          value,
        } as Adjustment,
      };
    });
  }, []);

  const handleApply = useCallback(() => {
    // If we're in detail view, create the layer and close dialog
    if (selectedAdjustment) {
      // Only create a layer if there's a pending adjustment
      if (pendingAdjustments[selectedAdjustment]) {
        const adjustment = pendingAdjustments[selectedAdjustment];
        addLayer({
          id: generateId(),
          name: `${getAllAdjustmentParams().find(adj => adj.name === selectedAdjustment)?.label || "Adjustment"}-${Object.keys(layers).length + 1}`,
          type: "adjustment",
          objects: { [adjustment.id]: adjustment },
          objectOrders: [adjustment.id],
        });
      }

      // Clear pending adjustments and close dialog
      setPendingAdjustments({});
      setSelectedAdjustment(null);
      onOpenChange(false);
      return;
    }

    // In grid view, just close the dialog
    onOpenChange(false);
  }, [pendingAdjustments, selectedAdjustment, addLayer, layers, onOpenChange]);

  const handleCancel = useCallback(() => {
    // If we're in detail view, discard the adjustment and go back to grid view
    if (selectedAdjustment) {
      setPendingAdjustments({});
      setSelectedAdjustment(null);
      return;
    }

    // In grid view, close dialog
    setPendingAdjustments({});
    setSelectedAdjustment(null);
    onOpenChange(false);
  }, [selectedAdjustment, onOpenChange]);

  const handleCardClick = useCallback((adjName: string) => {
    setSelectedAdjustment(adjName);
    // Clear any existing adjustment and initialize with default value
    const adjConfig = getAllAdjustmentParams().find(adj => adj.name === adjName);
    if (adjConfig && adjConfig.type === "slider") {
      setPendingAdjustments({
        [adjName]: {
          id: generateId(),
          category: "adjustment",
          type: adjName,
          value: adjConfig.defaultValue ?? 0,
        } as Adjustment,
      });
    }
  }, []);

  const handleBackToGrid = useCallback(() => {
    setSelectedAdjustment(null);
  }, []);

  // Component for rendering an adjustment card
  const AdjustmentCard = ({ adjustment }: { adjustment: Param }) => {
    if (adjustment.type !== "slider") return null;

    return (
      <button
        onClick={() => handleCardClick(adjustment.name)}
        className="flex flex-col gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all cursor-pointer bg-white"
      >
        {/* Before/After Preview */}
        <div className="flex items-center gap-2 justify-center">
          {/* Before Preview */}
          <div className="relative w-48 h-40 border border-gray-200 rounded overflow-hidden bg-gray-50">
            <SamplePreview adjustment={null} />
          </div>

          {/* Arrow */}
          <ArrowRight className="size-5 text-gray-400 flex-shrink-0" />

          {/* After Preview */}
          <div className="relative w-48 h-40 border border-gray-200 rounded overflow-hidden bg-gray-50">
            <SamplePreview adjustment={adjustment} />
          </div>
        </div>

        {/* Title */}
        <div className="text-sm font-medium text-center">{adjustment.label}</div>
      </button>
    );
  };

  // Component for rendering sample preview with adjustment applied
  const SamplePreview = ({ adjustment }: { adjustment: Param | null }) => {
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      const canvas = previewCanvasRef.current;
      const sampleCanvas = sampleCanvasRef.current;
      const context = canvas?.getContext("2d", { willReadFrequently: true });
      if (!context || !canvas || !sampleCanvas) return;

      // Set size
      canvas.width = 192; // w-48 = 192px
      canvas.height = 160; // h-40 = 160px

      // Copy from sample canvas
      context.drawImage(sampleCanvas, 0, 0, canvas.width, canvas.height);

      // Apply adjustment if provided with specific demo values
      if (adjustment && adjustment.type === "slider") {
        const demoValues: Record<string, number> = {
          brightness: 80,
          contrast: 50,
          exposure: 70,
          highlights: 70,
          shadows: 70,
          vibrance: 100,
          "hsb-hue": 100,
          "hsb-saturation": 70,
          "hsb-brightness": 30,
          temperature: 70,
          tint: 70,
        };

        const demoValue =
          demoValues[adjustment.name] ?? (adjustment.max ? adjustment.max * 0.5 : 50);
        const demoAdjustment: Adjustment = {
          id: generateId(),
          category: "adjustment",
          type: adjustment.name as Adjustment["type"],
          value: demoValue,
        };
        applyAdjustment(demoAdjustment, context, canvas.width, canvas.height);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adjustment, sampleCanvasReady]);

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
        <SlidersHorizontal className="size-6" />
      </Dialog.Trigger>
      <Dialog.Content className="w-[90vw] max-w-5xl max-h-[90vh] flex flex-col shadow-lg border">
        <Dialog.Content.Header className="border-b">
          <div className="flex items-center gap-2">
            {selectedAdjustment && (
              <button onClick={handleBackToGrid} className="p-1 hover:bg-gray-100 rounded">
                <ChevronLeft className="size-5" />
              </button>
            )}
            <h2 className="text-lg font-semibold">
              {selectedAdjustment
                ? getAllAdjustmentParams().find(adj => adj.name === selectedAdjustment)?.label
                : "Adjustments"}
            </h2>
          </div>
        </Dialog.Content.Header>

        {/* Hidden sample canvas for generating previews */}
        <canvas ref={sampleCanvasRef} className="hidden" />

        <div className="flex-1 overflow-auto">
          {selectedAdjustment ? (
            // Detail View - Show preview and single adjustment control
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

              {/* Adjustment Control */}
              <div className="border-t p-4 bg-white">
                {(() => {
                  const adj = getAllAdjustmentParams().find(a => a.name === selectedAdjustment);
                  if (!adj || adj.type !== "slider") return null;
                  return (
                    <SliderWithLabels
                      className="w-full max-w-md mx-auto"
                      min={adj.min}
                      max={adj.max}
                      value={pendingAdjustments[adj.name]?.value ?? adj.defaultValue ?? 0}
                      step={adj.step}
                      label={adj.label}
                      onChange={value => handleAdjustmentChange(adj.name, value)}
                      resetValue={adj.defaultValue ?? 0}
                    />
                  );
                })()}
              </div>
            </div>
          ) : (
            // Grid View - Show all adjustment cards
            <div className="p-6">
              {getAdjustmentsBySection().map(section => (
                <div key={section.title} className="mb-8 last:mb-0">
                  <h3 className="text-base font-semibold mb-4 text-gray-700">{section.title}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {section.adjustments.map(adj => (
                      <AdjustmentCard key={adj.name} adjustment={adj} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Dialog.Content.Footer className="flex gap-2 justify-end border-t">
          <Button variant="cancel" onClick={handleCancel}>
            {selectedAdjustment ? "Cancel" : "Close"}
          </Button>
          {selectedAdjustment && (
            <Button variant="apply" onClick={handleApply}>
              Apply
            </Button>
          )}
        </Dialog.Content.Footer>
      </Dialog.Content>
    </Dialog>
  );
};

export default AdjustmentsDialog;
