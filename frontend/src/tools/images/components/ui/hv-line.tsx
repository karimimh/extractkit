
interface HVLineProps {
  position: number;
  onPositionChange: (newPosition: number) => void;
  type: "horizontal" | "vertical";
}

export default function HVLine({
  type = "horizontal",
  onPositionChange,
  position,
}: HVLineProps) {
  const isHorizontal = type === "horizontal";
  const handleDrag = (event: MouseEvent) => {
    if (isHorizontal) {
      onPositionChange(event.clientY);
    } else {
      onPositionChange(event.clientX);
    }
  };

  return (
    <div
      className={`absolute bg-transparent border-dashed border-blue-600 ${
        isHorizontal ? "w-full h-[1px] border-t" : "h-full w-[1px] border-l"
      }`}
      style={{
        top: isHorizontal ? position : undefined,
        left: isHorizontal ? undefined : position,
        cursor: isHorizontal ? "row-resize" : "col-resize",
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        document.addEventListener("mousemove", handleDrag);
        document.addEventListener(
          "mouseup",
          () => {
            document.removeEventListener("mousemove", handleDrag);
          },
          { once: true }
        );
      }}
    />
  );
}
