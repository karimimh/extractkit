import { useEffect, useRef, useState } from "react";
import { Pencil, Pen, Highlighter, Eraser } from "lucide-react";
import Dialog from "@notes/ui/dialog/dialog";
import Button from "@notes/ui/button";
import ChalkIcon from "@notes/ui/chalk-icon";

type DrawTool = "pen" | "pencil" | "chalk" | "highlighter" | "eraser";

interface Point {
  x: number;
  y: number;
}

interface DrawingParticle {
  center: Point;
  color: string;
  size: number;
  alpha?: number;
  points?: Point[];
}

interface DrawingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (imageBlob: Blob) => void;
}

const interpolatePoints = (points: Point[], N: number): Point[] => {
  if (points.length < 2) return points;
  const result: Point[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    for (let j = 0; j <= N; j++) {
      const t = j / N;
      result.push({
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t,
      });
    }
  }
  return result;
};

const generateChalkPoints = (point: Point, size: number): Point[] => {
  const points: Point[] = [];
  for (let i = 0; i < size; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * size;
    points.push({
      x: point.x + radius * Math.cos(angle),
      y: point.y + radius * Math.sin(angle),
    });
  }
  return points;
};

const generatePencilPoints = (point: Point, size: number): Point[] => {
  const points: Point[] = [];
  for (let i = 0; i < size; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * (size / 8);
    points.push({
      x: point.x + radius * Math.cos(angle),
      y: point.y + radius * Math.sin(angle),
    });
  }
  return points;
};

const DrawingModal: React.FC<DrawingModalProps> = ({ isOpen, onClose, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<DrawTool>("pen");
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [particles, setParticles] = useState<DrawingParticle[]>([]);
  const [allStrokes, setAllStrokes] = useState<DrawingParticle[][]>([]);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 550 });

  useEffect(() => {
    if (!isOpen) {
      setParticles([]);
      setAllStrokes([]);
      setIsDrawing(false);
    }
  }, [isOpen]);

  // Update canvas dimensions based on dialog size
  useEffect(() => {
    if (!isOpen) return;

    const updateDimensions = () => {
      const dialogContent = canvasRef.current?.closest('[role="dialog"]') as HTMLElement;
      if (dialogContent) {
        const dialogWidth = dialogContent.offsetWidth;
        const dialogHeight = dialogContent.offsetHeight;

        setCanvasDimensions({
          width: dialogWidth - 20,
          height: dialogHeight - 140,
        });
      }
    };

    // Update dimensions when dialog opens
    updateDimensions();

    // Update on window resize
    window.addEventListener("resize", updateDimensions);

    // Use a timeout to ensure the dialog is fully rendered
    const timeout = setTimeout(updateDimensions, 100);

    return () => {
      window.removeEventListener("resize", updateDimensions);
      clearTimeout(timeout);
    };
  }, [isOpen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    allStrokes.forEach(stroke => renderStroke(stroke, ctx));
    if (particles.length > 0) {
      renderStroke(particles, ctx);
    }
  }, [particles, allStrokes]);

  const renderStroke = (stroke: DrawingParticle[], ctx: CanvasRenderingContext2D) => {
    if (stroke.length === 0) return;

    const firstParticle = stroke[0];
    const toolType = firstParticle.points
      ? firstParticle.points.length > 10
        ? "chalk"
        : "pencil"
      : firstParticle.alpha === 0.2
        ? "highlighter"
        : "pen";

    if (toolType === "chalk") {
      stroke.forEach(particle => {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.alpha || 0.5;
        particle.points?.forEach(p => {
          ctx.fillRect(p.x, p.y, 1, 1);
        });
      });
      ctx.globalAlpha = 1;
    } else if (toolType === "pencil") {
      stroke.forEach(particle => {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.alpha || 0.1;
        particle.points?.forEach(p => {
          ctx.fillRect(p.x, p.y, 1, 1);
        });
      });
      ctx.globalAlpha = 1;
    } else if (toolType === "highlighter") {
      ctx.globalAlpha = 0.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(stroke[0].center.x, stroke[0].center.y);
      stroke.forEach(particle => {
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = particle.size;
        ctx.lineTo(particle.center.x, particle.center.y);
      });
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else {
      ctx.strokeStyle = stroke[0].color;
      ctx.lineWidth = stroke[0].size;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(stroke[0].center.x, stroke[0].center.y);
      stroke.forEach(particle => {
        ctx.lineTo(particle.center.x, particle.center.y);
      });
      ctx.stroke();
    }
  };

  const getPoint = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handleStart = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    const p = getPoint(e);

    if (tool === "eraser") {
      erase(p);
      setIsDrawing(true);
      return;
    }

    let particle: DrawingParticle;

    if (tool === "chalk") {
      particle = {
        center: p,
        points: generateChalkPoints(p, size),
        alpha: Math.random() * 0.5 + 0.3,
        color,
        size,
      };
    } else if (tool === "pencil") {
      particle = {
        center: p,
        points: generatePencilPoints(p, size),
        alpha: Math.random() * 0.2 + 0.1,
        color,
        size,
      };
    } else if (tool === "highlighter") {
      particle = {
        center: p,
        color,
        size: size * 3,
        alpha: 0.2,
      };
    } else {
      particle = {
        center: p,
        color,
        size,
      };
    }

    setParticles([particle]);
    setIsDrawing(true);
  };

  const handleMove = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    if (!isDrawing) return;

    const p = getPoint(e);

    if (tool === "eraser") {
      erase(p);
      return;
    }
    setParticles(prev => {
      if (prev.length === 0) return prev;

      const lastParticle = prev[prev.length - 1];
      const dx = lastParticle.center.x - p.x;
      const dy = lastParticle.center.y - p.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 1) return prev;

      const interpolatedPoints = interpolatePoints(
        [lastParticle.center, p],
        Math.min(5, Math.max(1, Math.floor(distance / 2)))
      );

      const newParticles = interpolatedPoints.slice(1).map(point => {
        if (tool === "chalk") {
          return {
            center: point,
            points: generateChalkPoints(point, size),
            alpha: Math.random() * 0.5 + 0.3,
            color,
            size,
          };
        } else if (tool === "pencil") {
          return {
            center: point,
            points: generatePencilPoints(point, size),
            alpha: Math.random() * 0.2 + 0.1,
            color,
            size,
          };
        } else if (tool === "highlighter") {
          return {
            center: point,
            color,
            size: size * 3,
            alpha: 0.2,
          };
        } else {
          return {
            center: point,
            color,
            size,
          };
        }
      });

      return [...prev, ...newParticles];
    });
  };

  const erase = (point: Point) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const eraserSize = size * 3;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(point.x - eraserSize / 2, point.y - eraserSize / 2, eraserSize, eraserSize);
  };

  const handleEnd = () => {
    if (particles.length > 0) {
      setAllStrokes(prev => [...prev, particles]);
      setParticles([]);
    }
    setIsDrawing(false);
  };

  const handleClear = () => {
    setAllStrokes([]);
    setParticles([]);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(blob => {
      if (blob) {
        onSave(blob);
        onClose();
      }
    }, "image/png");
  };

  return (
    <Dialog isOpen={isOpen} onOpenChange={onClose} mobileVariant="fullscreen">
      <Dialog.Content className="max-w-4xl w-full relative rounded-none">
        <Dialog.Content.Header className="shadow-sm relative h-16">
          <h2 className="hidden sm:flex h-full font-bold items-center mr-4">Draw</h2>
          <div className="flex gap-4 sm:absolute sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 max-w-[calc(100%-4rem)] overflow-x-auto">
            <div className="flex items-center gap-1 border border-gray-300 rounded-md px-0.5">
              <Button
                variant="ghost"
                isActive={tool === "pen"}
                onClick={() => setTool("pen")}
                icon={Pen}
                iconSize="5"
                title="Pen"
                className="px-1"
              />
              <Button
                variant="ghost"
                isActive={tool === "pencil"}
                onClick={() => setTool("pencil")}
                icon={Pencil}
                iconSize="5"
                title="Pencil"
                className="px-1"
              />
              <Button
                onClick={() => setTool("chalk")}
                variant="ghost"
                isActive={tool === "chalk"}
                title="Chalk"
                className="px-1"
              >
                <ChalkIcon className="size-5" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => setTool("highlighter")}
                isActive={tool === "highlighter"}
                title="Highlighter"
                icon={Highlighter}
                iconSize="5"
                className="px-1"
              />
              <Button
                variant="ghost"
                onClick={() => setTool("eraser")}
                isActive={tool === "eraser"}
                title="Eraser"
                icon={Eraser}
                iconSize="5"
                className="px-1"
              />
            </div>
            <div className="flex items-center gap-1">
              {/* <label className="text-sm text-[var(--text-secondary)]">Color:</label> */}
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-1">
              <label className="text-sm text-[var(--text-secondary)]">Size:</label>
              <input
                type="range"
                min="1"
                max="20"
                value={size}
                onChange={e => setSize(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-sm text-[var(--text-secondary)] w-6">{size}</span>
            </div>
          </div>
        </Dialog.Content.Header>

        <div className="flex-1 overflow-auto flex items-start mt-2 justify-center bg-[var(--bg-secondary)]">
          <canvas
            ref={canvasRef}
            width={canvasDimensions.width}
            height={canvasDimensions.height}
            className="border border-[var(--border-primary)] bg-white cursor-crosshair touch-none"
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
          />
        </div>

        <Dialog.Content.Footer className="border-[var(--border-primary)] p-2 px-6 flex justify-between absolute bottom-0 left-0 right-0 bg-[var(--bg-secondary)] shadow-[0_-1px_4px_rgba(0,0,0,0.1)]">
          <button
            onClick={handleClear}
            className="px-4 py-2 rounded bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
          >
            Clear
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
            >
              Save Drawing
            </button>
          </div>
        </Dialog.Content.Footer>
      </Dialog.Content>
    </Dialog>
  );
};

export default DrawingModal;
