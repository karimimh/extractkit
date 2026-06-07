export type UseDrawObject = {
  handleClick?: (
    event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => void;
  handleDoubleClick?: (
    event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => void;
  handleMouseDown?: (event: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseMove?: (event: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseUp?: (event: React.MouseEvent<HTMLCanvasElement>) => void;
  handleTouchStart?: (event: React.TouchEvent<HTMLCanvasElement>) => void;
  handleTouchMove?: (event: React.TouchEvent<HTMLCanvasElement>) => void;
  handleTouchEnd?: (event: React.TouchEvent<HTMLCanvasElement>) => void;
  draw: () => Promise<void>;
};
