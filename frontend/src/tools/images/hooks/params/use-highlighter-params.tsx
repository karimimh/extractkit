import { ColorStyle } from "../../types/colorization-types";
import { useToolParams } from "./use-tool-params";

const useHighlighterParams = () => {
  const [getParameterValue] = useToolParams("draw", "Highlighter");
  const color = getParameterValue("color") as ColorStyle;
  const size = getParameterValue("size") as number;
  return { color, size };
};

export default useHighlighterParams;
