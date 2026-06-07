import { useUIContext } from "@images/context/ui/use-ui-context";
import { MenuType, ToolParam } from "@images/types/tool-types";
import { useEffect, useState } from "react";

export const useToolParams = (menuType: MenuType, toolName: string) => {
  const [toolParams, setToolParams] = useState<ToolParam[]>([]);
  const { tools } = useUIContext();

  useEffect(() => {
    const tool = tools[menuType]?.find(tool => tool.name === toolName);
    if (tool) {
      setToolParams(tool.params ?? []);
    }
  }, [menuType, toolName, tools]);

  const setParameterValue = (key: string, value: unknown) => {
    const paramIndex = toolParams.findIndex(param => param.name === key);
    if (paramIndex === -1) return;
    const newParams = [...toolParams];
    newParams[paramIndex].value = value;
    setToolParams(newParams);
  };

  const getParameterValue = (key: string) => {
    const param = toolParams.find(param => param.name === key);
    return param?.value;
  };

  return [getParameterValue, setParameterValue] as const;
};
