import { SELECT_TOOLS } from "@images/constants/tool-constants";
import { useUIActions } from "@images/context/ui/actions";
import { useUIContext } from "@images/context/ui/use-ui-context";
import { Crop } from "lucide-react";
import H2SidebarItem from "../sidebar/common-sidebar-items/h2-sidebar-item";
import H3SidebarItem from "../sidebar/common-sidebar-items/h3-sidebar-item";
import ToolsList from "./tools-list";
import Button from "../ui/button";

export default function SelectTools() {
  const { setSelectedTool } = useUIActions();
  const { selectedTool } = useUIContext();
  const isCropping = selectedTool?.type === "crop";

  const handleCropButtonClick = () => {
    setSelectedTool(isCropping ? undefined : { icon: Crop, type: "crop", name: "Crop" });
  };

  const handleHorizontalMirror = () => {};
  const handleVerticalMirror = () => {};

  return (
    <>
      <H2SidebarItem title="Selection" />
      <ToolsList
        tools={SELECT_TOOLS}
        onToolSelected={tool => setSelectedTool(tool)}
        selectedTool={selectedTool}
      />
      <H3SidebarItem title="AI-based Selection" />
      <H3SidebarItem title="Select Subject" />
      <H3SidebarItem title="Select Sky" />
      <H3SidebarItem title="Select Background" />
      <H2SidebarItem title="Crop" />
      <Button className="ml-4 pb-1" onClick={handleCropButtonClick} variant="plain">
        <Crop className={`icon-btn-md${isCropping ? " bg-white" : ""}`} />
      </Button>
      <H3SidebarItem title="Aspect Ratio" />
      <H3SidebarItem title="AI-based Crop" />
      <H2SidebarItem title="Rotate" />
      <H3SidebarItem title="Rotate CW" />
      <H3SidebarItem title="Rotate CCW" />
      <H2SidebarItem title="Mirror" />
      <Button text="Horizontal Mirror" onClick={handleHorizontalMirror} />
      <Button text="Vertical Mirror" onClick={handleVerticalMirror} />
      <H2SidebarItem title="Remove Object" />
      <H2SidebarItem title="Insert Objects" />
    </>
  );
}
