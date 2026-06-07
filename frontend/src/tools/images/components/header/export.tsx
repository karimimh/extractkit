import { useLayersContext } from "@images/context/layers/use-layers-context";
import { useUIContext } from "@images/context/ui/use-ui-context";
import { exportLayersToPng } from "@images/lib/export/export-png";
import { Size } from "@images/types/geometry-types";
import { rect2dim } from "@images/utils/math-utils";
import Button from "../ui/button";

const Export = () => {
  const { layers, layerOrders } = useLayersContext();
  const { layerFrame } = useUIContext();
  return (
    <div className="">
      <Button
        className="w-full"
        text="Export to PNG"
        variant="main"
        onClick={() =>
          layerFrame &&
          exportLayersToPng(layers, layerOrders, rect2dim(layerFrame) as Size, 2).then(file => {
            const url = URL.createObjectURL(file);
            const a = document.createElement("a");
            a.href = url;
            a.download = file.name;
            a.click();
            URL.revokeObjectURL(url);
          })
        }
      />
    </div>
  );
};

export default Export;
