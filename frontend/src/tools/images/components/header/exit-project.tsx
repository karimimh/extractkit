import { useLayersContext } from "@images/context/layers/use-layers-context";
import { useUIActions } from "@images/context/ui/actions";
import { Grip } from "lucide-react";
import Button from "../ui/button";

const ExitProject = () => {
  const { resetUI } = useUIActions();
  const { reset: resetProject } = useLayersContext();

  const handleExit = () => {
    resetProject();
    resetUI();
  };
  return (
    <Button
      onClick={handleExit}
      className="p-0.5 flex items-center justify-center text-persian-blue"
      variant="plain"
      icon={Grip}
      iconSize="7"
    />
  );
};

export default ExitProject;
