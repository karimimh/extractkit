import { useToolParams } from "./use-tool-params";

const usePathParams = () => {
  const [getParameterValue] = useToolParams("shapes", "Line");
  const lineColor = getParameterValue("lineColor") as string;
  const lineWidth = getParameterValue("lineWidth") as number;
  const isContinuous = getParameterValue("isContinuous") as boolean;
  return { lineColor, lineWidth, isContinuous };
};

export default usePathParams;
export type PathParams = ReturnType<typeof usePathParams>;
