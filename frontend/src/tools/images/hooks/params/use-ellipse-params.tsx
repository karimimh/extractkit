import { useToolParams } from "./use-tool-params";

const useEllipseParams = () => {
  const [getParameterValue] = useToolParams("shapes", "Ellipse");
  const bgColor = getParameterValue("bgColor") as string;
  const lineColor = getParameterValue("lineColor") as string;
  const lineWidth = getParameterValue("lineWidth") as number;
  const lineType = getParameterValue("lineType") as string;
  const isCircle = getParameterValue("isCircle") as boolean;
  const drawMethod = getParameterValue("drawMethod") as "Center" | "Corner";
  return { bgColor, lineColor, lineWidth, lineType, isCircle, drawMethod };
};

export default useEllipseParams;

export type EllipseParams = ReturnType<typeof useEllipseParams>;
