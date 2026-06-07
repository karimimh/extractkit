
import { Ban, BoxSelect, LucideIcon, SquarePlus } from "lucide-react";
import ArcIcon from "./arc-icon";
import ChalkIcon from "./chalk-icon";
import EllipseIcon from "./ellipse-icon";
import EquilateralTriangleIcon from "./equilateral-triangle-icon";
import FreeformIcon from "./freeform-icon";
import LineIcon from "./line-icon";
import MultiArcIcon from "./multiarc-icon";
import MultiLineIcon from "./multiline-icon";
import PolygonIcon from "./polygon-icon";
import RectangleIcon from "./rectangle-icon";
import RightTriangleIcon from "./right-triangle-icon";
import ShapesIcon from "./shapes-icon";

interface IconProps {
  name: string | LucideIcon;
  iconSize?: "3" | "4" | "5" | "6" | "7";
}

const iconStyles = {
  "3": "w-3 h-3",
  "4": "w-4 h-4",
  "5": "w-5 h-5",
  "6": "w-6 h-6",
  "7": "w-7 h-7",
};

const Icon = ({ name, iconSize = "6" }: IconProps) => {
  if (typeof name !== "string") {
    const IconComp = name;
    return <IconComp className={iconStyles[iconSize]} />;
  }
  if (name === "Ellipse") {
    return <EllipseIcon className={iconStyles[iconSize]} />;
  } else if (name === "Right Triangle") {
    return <RightTriangleIcon className={iconStyles[iconSize]} />;
  } else if (name === "Equilateral Triangle") {
    return <EquilateralTriangleIcon className={iconStyles[iconSize]} />;
  } else if (name === "Path") {
    return <MultiLineIcon className={iconStyles[iconSize]} />;
  } else if (name === "Polygon") {
    return <PolygonIcon className={iconStyles[iconSize]} />;
  } else if (name === "Line") {
    return <LineIcon className={iconStyles[iconSize]} />;
  } else if (name === "Arc") {
    return <ArcIcon className={iconStyles[iconSize]} />;
  } else if (name === "Multi Arc") {
    return <MultiArcIcon className={iconStyles[iconSize]} />;
  } else if (name === "Rectangle Selection") {
    return <RectangleIcon className={iconStyles[iconSize]} selection />;
  } else if (name === "Ellipse Selection") {
    return <EllipseIcon className={iconStyles[iconSize]} selection />;
  } else if (name === "Polygon Selection") {
    return <PolygonIcon className={iconStyles[iconSize]} selection />;
  } else if (name === "Path Selection") {
    return <LineIcon className={iconStyles[iconSize]} selection />;
  } else if (name === "Freeform Selection") {
    return <FreeformIcon className={iconStyles[iconSize]} selection />;
  } else if (name === "Chalk") {
    return <ChalkIcon className={iconStyles[iconSize]} />;
  } else if (name === "BoxSelect") {
    return <BoxSelect className={iconStyles[iconSize]} />;
  } else if (name === "SquarePlus") {
    return <SquarePlus className={iconStyles[iconSize]} />;
  } else if (name === "Shapes") {
    return <ShapesIcon className={iconStyles[iconSize]} />;
  }
  return <Ban className="w-6 h-6" />;
};

export default Icon;
