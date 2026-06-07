
import { cn } from "@images/utils/css-utils";

interface BookmarkedCokorsProps {
  className?: string;
  currentColor?: string;
  onColorClick?: (color?: string) => void;
  bookmarkedColors?: string[];
}

const BookmarkedCokors = ({
  className,
  currentColor,
  onColorClick,
  bookmarkedColors,
}: BookmarkedCokorsProps) => {
  return (
    <div
      className={cn(
        "flex-wrap overflow-y-auto flex flex-row items-center justify-start gap-0.5",
        className
      )}
    >
      {bookmarkedColors?.map((color) => (
        <div
          className={cn(
            "cursor-pointer aspect-square border rounded-full",
            currentColor?.toLowerCase() === color && "border-black shadow-lg"
          )}
          onClick={() => onColorClick?.(color)}
          key={color}
          style={{
            backgroundColor: color,
            width: "1.15rem",
            height: "1.15rem",
          }}
        />
      ))}
    </div>
  );
};

export default BookmarkedCokors;
