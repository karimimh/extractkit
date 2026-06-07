"use client";

import { COLORIZATION_CONTENT, getColorizationEditType } from "@images/constants/colorization-constants";
import { useLayersContext } from "@images/context/layers/use-layers-context";
import { useUIContext } from "@images/context/ui/use-ui-context";
import { applyAdjustment, applyColorReplacement } from "@images/lib/adjustments/adjustments";
import {
  applyClipping,
  applyDigitalNegative,
  applyThresholding,
  contrastStretch,
  convertToGrayscale,
  intensityLevelSlicing,
  logarithmicTransform,
  powerLawTransform,
} from "@images/lib/cv/cv-point-ops";
import { drawObject } from "@images/lib/layers/render";
import { Colorization } from "@images/types/colorization-types";
import { ControlGroup } from "@images/types/ui-types";
import { generateId } from "@images/utils/object-utils";
import { ArrowRight, ChevronLeft, Palette } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Button from "../ui/button";
import ControlFactory from "../ui/control-factory";
import Dialog from "../ui/dialog/dialog";

interface ColorizationsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const ColorizationsDialog = ({ isOpen, onOpenChange }: ColorizationsDialogProps) => {
  const { layerOrders, layers, addLayer } = useLayersContext();
  const { layerFrame } = useUIContext();
  const layersList = Object.values(layers);
  const hasImageObject = layersList.some(
    layer => layer.objects && Object.values(layer.objects).some(obj => obj.type === "image")
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sampleCanvasRef = useRef<HTMLCanvasElement>(null);

  // Local state for colorization parameters that will be applied on confirm
  const [paramValues, setParamValues] = useState<Record<string, unknown>>({});
  const [selectedColorization, setSelectedColorization] = useState<string | null>(null);

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

  // Redraw canvas whenever parameters change
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

    // Apply pending colorization on top if one is selected
    if (selectedColorization) {
      const section = COLORIZATION_CONTENT.find(c => c.title === selectedColorization);
      if (section) {
        const editType = getColorizationEditType(section.title);
        if (!editType) return;

        const colorization: Partial<Colorization> = {
          category: "colorization",
          type: editType,
        };

        // Build colorization object with current param values
        for (const param of section.controls[0].params) {
          const value = paramValues[`${section.title}-${param.name}`];
          if (value !== undefined) {
            (colorization as any)[param.name] = value;
          } else if (
            param.type === "slider" ||
            param.type === "real-number" ||
            param.type === "integer-number"
          ) {
            (colorization as any)[param.name] = param.defaultValue;
          }
        }

        // Apply the colorization to the canvas
        applyColorizationToCanvas(
          colorization as Colorization,
          context,
          canvas.width,
          canvas.height
        );
      }
    }
  }, [layerOrders, layers, paramValues, selectedColorization, layerFrame]);

  const applyColorizationToCanvas = (
    colorization: Colorization,
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    if (colorization.type === "digital-negative") {
      applyDigitalNegative(ctx, canvasWidth, canvasHeight);
    } else if (colorization.type === "thresholding") {
      applyThresholding(ctx, canvasWidth, canvasHeight, colorization.threshold);
    } else if (colorization.type === "clipping") {
      applyClipping(
        ctx,
        canvasWidth,
        canvasHeight,
        colorization.minIntensity,
        colorization.maxIntensity
      );
    } else if (colorization.type === "contrast-stretching") {
      contrastStretch(
        ctx,
        canvasWidth,
        canvasHeight,
        colorization.s1,
        colorization.r1,
        colorization.s2,
        colorization.r2
      );
    } else if (colorization.type === "intensity-level-slicing") {
      intensityLevelSlicing(
        ctx,
        canvasWidth,
        canvasHeight,
        colorization.minIntensity,
        colorization.maxIntensity,
        colorization.withBackground
      );
    } else if (colorization.type === "logarithmic-transformation") {
      logarithmicTransform(ctx, canvasWidth, canvasHeight, colorization.c);
    } else if (colorization.type === "power-law-transformation") {
      powerLawTransform(ctx, canvasWidth, canvasHeight, colorization.c, colorization.gamma);
    } else if (colorization.type === "convert-to-grayscale") {
      convertToGrayscale(ctx, canvasWidth, canvasHeight);
    } else if (colorization.type === "color-replacement") {
      applyColorReplacement(
        colorization.sourceColor,
        colorization.targetColor,
        colorization.range,
        ctx,
        canvasWidth,
        canvasHeight
      );
    }
  };

  useEffect(() => {
    if (isOpen && layerFrame) {
      const timer = setTimeout(async () => {
        await Promise.all([drawCanvas(), drawSampleCanvas()]);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, layerFrame, drawCanvas, drawSampleCanvas]);

  useEffect(() => {
    if (isOpen) {
      if (selectedColorization) {
        drawCanvas();
      } else {
        drawSampleCanvas();
      }
    }
  }, [
    layers,
    layerOrders,
    paramValues,
    selectedColorization,
    isOpen,
    drawCanvas,
    drawSampleCanvas,
  ]);

  const setParamValue = (sectionTitle: string, paramName: string, value: unknown): void => {
    setParamValues(prevValues => ({
      ...prevValues,
      [`${sectionTitle}-${paramName}`]: value,
    }));
  };

  const handleApply = useCallback(() => {
    // If we're in detail view, create the layer and close dialog
    if (!selectedColorization) {
      onOpenChange(false);
      return;
    }

    const section = COLORIZATION_CONTENT.find(c => c.title === selectedColorization);
    if (!section) return;

    const editType = getColorizationEditType(section.title);
    if (!editType) return;

    const edit: Partial<Colorization> = {
      category: "colorization",
      id: generateId(),
      type: editType,
    };

    for (const param of section.controls[0].params) {
      const value = paramValues[`${section.title}-${param.name}`];
      if (value !== undefined) {
        (edit as any)[param.name] = value;
      }
    }

    addLayer({
      id: generateId(),
      name: `${section.title}-${Object.keys(layers).length + 1}`,
      type: "colorization",
      objects: { [(edit as Colorization).id]: edit as Colorization },
      objectOrders: [(edit as Colorization).id],
    });

    // Clear state and close dialog
    setParamValues({});
    setSelectedColorization(null);
    onOpenChange(false);
  }, [selectedColorization, paramValues, addLayer, layers, onOpenChange]);

  const handleCancel = useCallback(() => {
    // If we're in detail view, discard and go back to grid view
    if (selectedColorization) {
      setParamValues({});
      setSelectedColorization(null);
      return;
    }

    // In grid view, close dialog
    setParamValues({});
    setSelectedColorization(null);
    onOpenChange(false);
  }, [selectedColorization, onOpenChange]);

  const handleCardClick = useCallback((colorizationGroup: ControlGroup) => {
    setSelectedColorization(colorizationGroup.title);
    // Initialize param values with defaults
    const newParamValues: Record<string, unknown> = {};
    for (const param of colorizationGroup.controls[0].params) {
      if (
        param.type === "slider" ||
        param.type === "real-number" ||
        param.type === "integer-number"
      ) {
        newParamValues[`${colorizationGroup.title}-${param.name}`] = param.defaultValue;
      }
    }
    setParamValues(newParamValues);
  }, []);

  const handleBackToGrid = useCallback(() => {
    setSelectedColorization(null);
    setParamValues({});
  }, []);

  // Component for rendering a colorization card
  const ColorizationCard = ({ colorization }: { colorization: ControlGroup }) => {
    return (
      <button
        onClick={() => handleCardClick(colorization)}
        className="flex flex-col gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all cursor-pointer bg-white"
      >
        {/* Before/After Preview */}
        <div className="flex items-center gap-2 justify-center">
          {/* Before Preview */}
          <div className="relative w-48 h-40 border border-gray-200 rounded overflow-hidden bg-gray-50">
            <SamplePreview colorization={null} />
          </div>

          {/* Arrow */}
          <ArrowRight className="size-5 text-gray-400 flex-shrink-0" />

          {/* After Preview */}
          <div className="relative w-48 h-40 border border-gray-200 rounded overflow-hidden bg-gray-50">
            <SamplePreview colorization={colorization} />
          </div>
        </div>

        {/* Title */}
        <div className="text-sm font-medium text-center">{colorization.title}</div>
      </button>
    );
  };

  // Component for rendering sample preview with colorization applied
  const SamplePreview = ({ colorization }: { colorization: ControlGroup | null }) => {
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

      // Apply colorization if provided
      if (colorization) {
        const editType = getColorizationEditType(colorization.title);
        if (!editType) return;

        const colorizationObj: Partial<Colorization> = {
          category: "colorization",
          type: editType,
        };

        // Use specific demo values for each colorization type
        const demoValues: Record<string, any> = {
          Thresholding: { threshold: 100 },
          Clipping: { minIntensity: 50, maxIntensity: 200 },
          "Contrast Stretching": { s1: 20, r1: 20, s2: 200, r2: 200 },
          "Intensity Level Slicing": { minIntensity: 100, maxIntensity: 200, withBackground: true },
          "Logarithmic Transformation": { c: 50 },
          "Power Law Transformation": { c: 1, gamma: 1.2 },
          "Color Replacement": { sourceColor: "#ffffff", targetColor: "#000000", range: 100 },
        };

        // Check if we have specific demo values for this colorization
        const specificValues = demoValues[colorization.title];

        if (specificValues) {
          // Use specific demo values
          Object.assign(colorizationObj, specificValues);
        } else {
          // Fallback to generic values for params
          for (const param of colorization.controls[0].params) {
            if (param.type === "slider") {
              const min = param.min ?? 0;
              const max = param.max ?? 100;
              const demoValue = (min + max) / 2;
              (colorizationObj as any)[param.name] = demoValue;
            } else if (param.type === "real-number" || param.type === "integer-number") {
              (colorizationObj as any)[param.name] = param.defaultValue ?? 0;
            } else if (param.type === "boolean") {
              (colorizationObj as any)[param.name] = param.defaultValue ?? true;
            } else if (param.type === "color") {
              (colorizationObj as any)[param.name] = "#000000";
            } else if (param.type === "select") {
              (colorizationObj as any)[param.name] = param.defaultValue ?? param.options[0]?.value;
            }
          }
        }

        applyColorizationToCanvas(
          colorizationObj as Colorization,
          context,
          canvas.width,
          canvas.height
        );
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [colorization, sampleCanvasReady]);

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
        <Palette className="size-6" />
      </Dialog.Trigger>
      <Dialog.Content className="w-[90vw] max-w-5xl max-h-[90vh] flex flex-col shadow-lg border">
        <Dialog.Content.Header className="border-b">
          <div className="flex items-center gap-2">
            {selectedColorization && (
              <button onClick={handleBackToGrid} className="p-1 hover:bg-gray-100 rounded">
                <ChevronLeft className="size-5" />
              </button>
            )}
            <h2 className="text-lg font-semibold">{selectedColorization || "Colorizations"}</h2>
          </div>
        </Dialog.Content.Header>

        {/* Hidden sample canvas for generating previews */}
        <canvas ref={sampleCanvasRef} className="hidden" />

        <div className="flex-1 overflow-auto">
          {selectedColorization ? (
            // Detail View - Show preview and colorization controls
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

              {/* Colorization Controls */}
              <div className="border-t p-4 bg-white">
                {(() => {
                  const section = COLORIZATION_CONTENT.find(c => c.title === selectedColorization);
                  if (!section) return null;

                  return (
                    <div className="max-w-md mx-auto space-y-2">
                      {section.controls[0].params.length === 0 ? (
                        <div className="text-center text-gray-600">
                          This colorization has no adjustable parameters
                        </div>
                      ) : (
                        section.controls[0].params.map(param => {
                          const paramKey = `${section.title}-${param.name}`;
                          const paramValue = paramValues[paramKey];
                          const defaultValue =
                            param.type === "slider" ||
                            param.type === "real-number" ||
                            param.type === "integer-number"
                              ? param.defaultValue
                              : undefined;

                          return (
                            <ControlFactory
                              key={paramKey}
                              param={param}
                              value={paramValue !== undefined ? paramValue : defaultValue}
                              onChange={val => setParamValue(section.title, param.name, val)}
                              className="w-full"
                            />
                          );
                        })
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            // Grid View - Show all colorization cards
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                {COLORIZATION_CONTENT.map(colorization => (
                  <ColorizationCard key={colorization.title} colorization={colorization} />
                ))}
              </div>
            </div>
          )}
        </div>

        <Dialog.Content.Footer className="flex gap-2 justify-end border-t">
          <Button variant="cancel" onClick={handleCancel}>
            {selectedColorization ? "Cancel" : "Close"}
          </Button>
          {selectedColorization && (
            <Button variant="apply" onClick={handleApply}>
              Apply
            </Button>
          )}
        </Dialog.Content.Footer>
      </Dialog.Content>
    </Dialog>
  );
};

export default ColorizationsDialog;
