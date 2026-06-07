
import { Point } from "@images/types/geometry-types";
import { cn } from "@images/utils/css-utils";

interface MouseCoordinatesLabelProps {
  position: Point | undefined;
}

const MouseCoordinatesLabel = ({ position }: MouseCoordinatesLabelProps) => {
  return position ? (
    <div
      className={cn(
        "hidden sm:block bg-[#add8e6aa] px-2 py-1 shadow-sm absolute bottom-0 left-0 -translate-x-full text-xs"
      )}
    >
      {position.x}, {position.y}
    </div>
  ) : null;
};

export default MouseCoordinatesLabel;
