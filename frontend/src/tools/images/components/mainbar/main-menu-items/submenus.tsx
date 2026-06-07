import { TOOLS } from "@images/constants/tool-constants";
import { useUIActions } from "@images/context/ui/actions";
import { useUIContext } from "@images/context/ui/use-ui-context";
import { ChevronLeft, MoreHorizontalIcon } from "lucide-react";
import { useEffect, useState } from "react";
import ToolIcon from "../../toolbar/tool-icon";
import ToolSettings from "../../toolbar/tool-settings";
import Button from "../../ui/button";
import Popover from "../../ui/popover";

interface SubMenusProps {
  menuType: "shapes" | "draw";
}

const SubMenus = ({ menuType }: SubMenusProps) => {
  const { selectedTool } = useUIContext();
  const { setSelectedMenu, setSelectedTool } = useUIActions();

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    if (!selectedTool) {
      setIsPopoverOpen(false);
    }
  }, [selectedTool]);

  return (
    <div className="flex items-center gap-0">
      <Button
        className="text-slate-600 mr-4 pl-0 pr-2 text-sm"
        icon={ChevronLeft}
        iconSize="4"
        variant="secondary"
        text="Back"
        onClick={() => {
          setSelectedMenu(undefined);
          setSelectedTool(undefined);
        }}
      />
      {TOOLS[menuType].map(tool => (
        <div className="flex flex-col items-center" key={tool.name}>
          <Button
            className="p-1 relative rounded"
            isActive={tool.name === selectedTool?.name}
            onClick={() => {
              setSelectedTool(tool.name === selectedTool?.name ? undefined : tool);
            }}
            variant="plain"
          >
            <ToolIcon tool={tool} iconSize="6" />
          </Button>
          {tool.name === selectedTool?.name && (
            <Popover
              className="absolute -bottom-2 lef-1/2"
              isOpen={isPopoverOpen}
              setIsOpen={setIsPopoverOpen}
            >
              <Popover.Trigger className="">
                <MoreHorizontalIcon className="size-4 text-blue-600" />
              </Popover.Trigger>
              <Popover.Content>
                {selectedTool ? (
                  <ToolSettings menuType={selectedTool.menuType} tool={selectedTool} />
                ) : null}
              </Popover.Content>
            </Popover>
          )}
        </div>
      ))}
    </div>
  );
};

export default SubMenus;
