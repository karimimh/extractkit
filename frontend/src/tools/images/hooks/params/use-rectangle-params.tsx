import { useToolParams } from "./use-tool-params";

const useRectangleParams = () => {
  const [getParameterValue] = useToolParams("shapes", "Rectangle");
  const bgColor = getParameterValue("bgColor") as string;
  const lineColor = getParameterValue("lineColor") as string;
  const lineWidth = getParameterValue("lineWidth") as number;
  const lineType = getParameterValue("lineType") as string;
  const cornerRadius = getParameterValue("cornerRadius") as number;
  const isSquare = getParameterValue("isSquare") as boolean;
  return { bgColor, lineColor, lineWidth, lineType, cornerRadius, isSquare };
};

export default useRectangleParams;

export type RectangleParams = ReturnType<typeof useRectangleParams>;
