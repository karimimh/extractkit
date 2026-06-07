import { useUIActions } from "@images/context/ui/actions";
import { useUIContext } from "@images/context/ui/use-ui-context";
import { Layers } from "lucide-react";
import Button from "../ui/button";

interface SidebarButtonProps {
  className?: string;
}

const SidebarButton = ({ className }: SidebarButtonProps) => {
  const { setSidebarOpen } = useUIActions();
  const { isSidebarOpen, layerFrame } = useUIContext();
  return (
    <Button
      className={className}
      icon={Layers}
      iconSize="5"
      variant="secondary"
      onClick={() => setSidebarOpen(!isSidebarOpen)}
      disabled={!layerFrame}
    />
  );
};

export default SidebarButton;
