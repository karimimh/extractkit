import { useToolParams } from "./use-tool-params";

const usePolygonParams = () => {
  const [getParameterValue] = useToolParams("shapes", "Polygon");
  const bgColor = getParameterValue("bgColor") as string;
  const lineColor = getParameterValue("lineColor") as string;
  const lineWidth = getParameterValue("lineWidth") as number;
  const numberOfSides = getParameterValue("numberOfSides") as number;
  const lineDash = getParameterValue("lineDash") as number[];
  return { bgColor, lineColor, lineWidth, numberOfSides, lineDash };
};

export default usePolygonParams;
export type PolygonParams = ReturnType<typeof usePolygonParams>;
