import { Tool } from "@images/types/tool-types";

export const isDrawingTool = (tool?: Tool) => {
  return (
    tool?.menuType === "shapes" ||
    tool?.menuType === "draw" ||
    tool?.menuType === "text"
  );
};
