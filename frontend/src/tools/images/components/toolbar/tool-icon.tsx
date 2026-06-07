
import { Tool } from "@images/types/tool-types";
import { Ban } from "lucide-react";
import ArcIcon from "../ui/icons/arc-icon";
import ChalkIcon from "../ui/icons/chalk-icon";
import EllipseIcon from "../ui/icons/ellipse-icon";
import EquilateralTriangleIcon from "../ui/icons/equilateral-triangle-icon";
import FreeformIcon from "../ui/icons/freeform-icon";
import LineIcon from "../ui/icons/line-icon";
import MultiArcIcon from "../ui/icons/multiarc-icon";
import MultiLineIcon from "../ui/icons/multiline-icon";
import PolygonIcon from "../ui/icons/polygon-icon";
import RectangleIcon from "../ui/icons/rectangle-icon";
import RightTriangleIcon from "../ui/icons/right-triangle-icon";

interface ToolIconProps {
  tool: Tool;
  iconSize?: "3" | "4" | "5" | "6" | "7";
}

const iconStyles = {
  "3": "w-3 h-3",
  "4": "w-4 h-4",
  "5": "w-5 h-5",
  "6": "w-6 h-6",
  "7": "w-7 h-7",
};

const ToolIcon = ({ tool, iconSize = "4" }: ToolIconProps) => {
  if (tool.name === "Ellipse") {
    return <EllipseIcon className={iconStyles[iconSize]} />;
  } else if (tool.name === "Right Triangle") {
    return <RightTriangleIcon className={iconStyles[iconSize]} />;
  } else if (tool.name === "Equilateral Triangle") {
    return <EquilateralTriangleIcon className={iconStyles[iconSize]} />;
  } else if (tool.name === "Path") {
    return <MultiLineIcon className={iconStyles[iconSize]} />;
  } else if (tool.name === "Polygon") {
    return <PolygonIcon className={iconStyles[iconSize]} />;
  } else if (tool.name === "Line") {
    return <LineIcon className={iconStyles[iconSize]} />;
  } else if (tool.name === "Arc") {
    return <ArcIcon className={iconStyles[iconSize]} />;
  } else if (tool.name === "Multi Arc") {
    return <MultiArcIcon className={iconStyles[iconSize]} />;
  } else if (tool.name === "Rectangle Selection") {
    return <RectangleIcon className={iconStyles[iconSize]} selection />;
  } else if (tool.name === "Ellipse Selection") {
    return <EllipseIcon className={iconStyles[iconSize]} selection />;
  } else if (tool.name === "Polygon Selection") {
    return <PolygonIcon className={iconStyles[iconSize]} selection />;
  } else if (tool.name === "Path Selection") {
    return <LineIcon className={iconStyles[iconSize]} selection />;
  } else if (tool.name === "Freeform Selection") {
    return <FreeformIcon className={iconStyles[iconSize]} selection />;
  } else if (tool.name === "Chalk") {
    return <ChalkIcon className={iconStyles[iconSize]} />;
  }
  return tool.icon ? (
    <tool.icon className={iconStyles[iconSize]} />
  ) : (
    <Ban className="w-6 h-6" />
  );
};

export default ToolIcon;
