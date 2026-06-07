import { ColorStyle } from "../../types/colorization-types";
import { useToolParams } from "./use-tool-params";

const useChalkParams = () => {
  const [getParameterValue] = useToolParams("draw", "Chalk");
  const color = getParameterValue("color") as ColorStyle;
  const size = getParameterValue("size") as number;
  return { color, size };
};

export default useChalkParams;
