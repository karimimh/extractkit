import Button from "@images/components/ui/button";
import Icon from "@images/components/ui/icons/icon";
import { useUIActions } from "@images/context/ui/actions";
import { useUIContext } from "@images/context/ui/use-ui-context";

const ShapesMenuItem = () => {
  const { setSelectedMenu } = useUIActions();
  const { layerFrame } = useUIContext();

  return (
    <Button
      className="p-1 rounded"
      onClick={() => setSelectedMenu("shapes")}
      variant="plain"
      disabled={!layerFrame}
    >
      <Icon name="Shapes" iconSize="6" />
    </Button>
  );
};

export default ShapesMenuItem;
