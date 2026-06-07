import { ColorStyle } from "../../types/colorization-types";
import { useToolParams } from "./use-tool-params";

const usePencilParams = () => {
  const [getParameterValue] = useToolParams("draw", "Pencil");
  const color = getParameterValue("color") as ColorStyle;
  const size = getParameterValue("size") as number;
  return { color, size };
};

export default usePencilParams;
