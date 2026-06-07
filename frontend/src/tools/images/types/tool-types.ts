import { LucideIcon } from "lucide-react";

export type ToolType =
  | "rectangle"
  | "ellipse"
  | "path"
  | "arc"
  | "polygon"
  | "text"
  | "freeform"
  | "image"
  | "chalk"
  | "fountain-pen"
  | "pencil"
  | "pen"
  | "highlighter"
  | "watercolor"
  | "spray"
  | "select-rectangle"
  | "select-freeform"
  | "select-ellipse"
  | "select-polygon"
  | "select-path"
  | "crop"
  | "pointer";

export type Tool = {
  name: string;
  icon?: LucideIcon;
  type: ToolType;
  params?: ToolParam[];
  menuType: MenuType;
  category?: string;
};

export type ToolParam = (
  | {
      type: "slider";
      min?: number;
      max?: number;
      step?: number;
    }
  | {
      type: "color";
      label?: string;
    }
  | {
      type: "count";
      min?: number;
      max?: number;
      step?: number;
    }
  | {
      type: "checkbox";
      label?: string;
    }
  | {
      type: "select";
      options: string[];
      icons?: LucideIcon[];
      defaultValue?: string;
      inputType?: "dropdown" | "toggle-group";
    }
  | {
      type: "number";
      min?: number;
      max?: number;
      inputType?: "plus-minus" | "chevrons";
    }
  | {
      type: "text";
    }
) & {
  name: string;
  label?: string;
  value?: unknown;
};

export type MenuType = "ai" | "adjustments" | "colors" | "filters" | "text" | "shapes" | "draw";

export type Menu = {
  menuType: MenuType;
  icon: string | LucideIcon;
  description: string;
};
