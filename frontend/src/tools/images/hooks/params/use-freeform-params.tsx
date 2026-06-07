import { useToolParams } from "./use-tool-params";

const useFreeformParams = () => {
  const [getParameterValue] = useToolParams("shapes", "Freeform");
  const bgColor = getParameterValue("bgColor") as string;
  const lineColor = getParameterValue("lineColor") as string;
  const lineWidth = getParameterValue("lineWidth") as number;
  const lineType = getParameterValue("lineType") as string;
  const lineDash = getParameterValue("lineDash") as number[];
  return { bgColor, lineColor, lineWidth, lineType, lineDash };
};

export default useFreeformParams;
