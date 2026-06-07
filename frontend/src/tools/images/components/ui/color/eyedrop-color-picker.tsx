import { useLayersContext } from "@images/context/layers/use-layers-context";
import { useUIContext } from "@images/context/ui/use-ui-context";
import { rgbToHex } from "@images/lib/cv/cv-color-conversion";
import { renderAllLayers } from "@images/utils/layer-utils";
import { scalePoint } from "@images/utils/ui-utils";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface EyedropColorPickerProps {
  onChange?: (color?: string) => void;
  onCancel?: () => void;
}

export default function EyedropColorPicker({ onChange, onCancel }: EyedropColorPickerProps) {
  const [isEyedropActive, setIsEyedropActive] = useState(true);
  const [hoverColor, setHoverColor] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { layers, layerOrders } = useLayersContext();
  const { layerFrame } = useUIContext();

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvasElement = canvasRef.current;
    const context = canvasElement?.getContext("2d", {
      willReadFrequently: true,
    });
    const rect = canvasElement?.getBoundingClientRect();
    if (!rect || !context || !layerFrame) return;
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setMousePosition({ x, y });
    const scaledPosition = scalePoint(
      { x, y },
      { x: 0, y: 0, width: rect.width, height: rect.height },
      layerFrame
    );
    const pixelData = context.getImageData(scaledPosition.x, scaledPosition.y, 1, 1).data;
    const rgb = rgbToHex(pixelData[0], pixelData[1], pixelData[2]);
    setHoverColor(rgb);
  };

  const layersAreaTag = document.getElementById("layers-area");

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    if (!isEyedropActive || !context || !canvas || !layerFrame) return;
    // TODO: this action may take time and the user may think it is not working
    renderAllLayers(canvas, layers, layerOrders, layerFrame.width, layerFrame.height);
  }, [isEyedropActive, layerFrame, layerOrders, layers]);

  const handleCanvasClick = () => {
    setIsEyedropActive(false);
    if (hoverColor) {
      onChange?.(hoverColor);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isEyedropActive) {
        setIsEyedropActive(false);
        onCancel?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEyedropActive, onCancel]);

  return createPortal(
    <>
      <canvas
        className="absolute top-0 left-0 w-full h-full z-50"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        ref={canvasRef}
      />
      {hoverColor && (
        <div
          style={{
            position: "absolute",
            left: mousePosition.x - 15,
            top: mousePosition.y - 15,
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            backgroundColor: hoverColor,
            border: "2px solid #000",
            pointerEvents: "none",
            zIndex: 1000,
          }}
        />
      )}
    </>,
    layersAreaTag!
  );
}
