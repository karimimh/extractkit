import { useToolParams } from "./use-tool-params";

const useArcParams = () => {
  const [getParameterValue] = useToolParams("shapes", "Arc");
  const lineColor = getParameterValue("lineColor") as string;
  const lineWidth = getParameterValue("lineWidth") as number;
  const arcType = (getParameterValue("arcType") ?? "quadratic") as "bezier" | "quadratic";
  return { lineColor, lineWidth, arcType };
};

export default useArcParams;

export type ArcParams = ReturnType<typeof useArcParams>;
