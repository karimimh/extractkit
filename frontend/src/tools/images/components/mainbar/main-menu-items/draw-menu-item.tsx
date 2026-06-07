import Button from "@images/components/ui/button";
import FreeformIcon from "@images/components/ui/icons/freeform-icon";
import { useUIActions } from "@images/context/ui/actions";
import { useUIContext } from "@images/context/ui/use-ui-context";

interface DrawMenuItemProps {}

const DrawMenuItem = ({}: DrawMenuItemProps) => {
  const { setSelectedMenu } = useUIActions();
  const { layerFrame } = useUIContext();

  return (
    <Button
      className="p-1 rounded"
      onClick={() => setSelectedMenu("draw")}
      variant="plain"
      disabled={!layerFrame}
    >
      <FreeformIcon />
    </Button>
  );
};

export default DrawMenuItem;
