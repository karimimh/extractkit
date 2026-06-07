import { useUIContext } from "@images/context/ui/use-ui-context";
import { Rect } from "@images/types/geometry-types";
import { useCallback, useEffect, useRef } from "react";

const Grid = ({ layerFrame }: { layerFrame: Rect }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { grid, selectedTool } = useUIContext();
  const color = "rgba(0, 0, 0, 0.1)";

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!context || !canvas || !grid) return;
    context.clearRect(0, 0, canvas.width, canvas.height);

    const { columns, rows, status } = grid;
    if (status === "hide") return;
    if (!selectedTool && status === "show-when-drawing") return;

    const cellWidth = layerFrame.width / columns;
    const cellHeight = layerFrame.height / rows;

    context.strokeStyle = color;
    context.lineWidth = 1;

    for (let i = 1; i < columns; i++) {
      const x = i * cellWidth;
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, layerFrame.height);
      context.stroke();
    }

    for (let i = 1; i < rows; i++) {
      const y = i * cellHeight;
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(layerFrame.width, y);
      context.stroke();
    }
  }, [grid, layerFrame.height, layerFrame.width, selectedTool]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      ref={canvasRef}
      width={layerFrame.width}
      height={layerFrame.height}
    />
  );
};

export default Grid;
