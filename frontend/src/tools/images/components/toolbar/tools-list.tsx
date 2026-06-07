import { Tool } from "@images/types/tool-types";
import { Fragment } from "react";
import Button from "../ui/button";
import ToolIcon from "./tool-icon";

interface ToolsListProps {
  tools: Tool[];
  selectedTool?: Tool;
  onToolSelected: (tool?: Tool) => void;
}

export default function ToolsList({
  tools,
  selectedTool,
  onToolSelected,
}: ToolsListProps) {
  return (
    <div className="flex items-center justify-center flex-wrap px-1 w-28 bg-slate-200 rounded-md rounded-tl-none p-1">
      {tools.map((tool) => (
        <Fragment key={tool.name}>
          <Button
            className="px-1"
            isActive={selectedTool?.name === tool.name}
            key={tool.name}
            onClick={() =>
              onToolSelected(
                selectedTool?.name === tool.name ? undefined : tool
              )
            }
            variant="ghost"
          >
            <ToolIcon tool={tool} iconSize="6" />
          </Button>
        </Fragment>
      ))}
    </div>
  );
}
