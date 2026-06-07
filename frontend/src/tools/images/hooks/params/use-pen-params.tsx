import { ColorStyle } from "../../types/colorization-types";
import { useToolParams } from "./use-tool-params";

const usePenParams = () => {
  const [getParameterValue] = useToolParams("draw", "Pen");
  const color = getParameterValue("color") as ColorStyle;
  const size = getParameterValue("size") as number;
  return { color, size };
};

export default usePenParams;
