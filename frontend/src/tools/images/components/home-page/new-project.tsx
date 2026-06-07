import { useLayersContext } from "@images/context/layers/use-layers-context";
import { useUIActions } from "@images/context/ui/actions";
import { ImageObject } from "@images/types/layer-types";
import { createImagePreview } from "@images/utils/image-utils";
import { generateId } from "@images/utils/object-utils";
import { ImagePlus } from "lucide-react";
import { useState } from "react";
import Card from "../ui/card";
import FileDropzone from "../ui/file-dropzone";
import LoadingIndicator from "../ui/loading-indicator";

const NewProject = () => {
  const { addLayer } = useLayersContext();
  const { setLayerFrame } = useUIActions();
  const [isLoading, setIsLoading] = useState(false);

  const handleImageFileChange = (f: File | null) => {
    const reader = new FileReader();

    reader.onload = e => {
      if (e.target && e.target.result) {
        const img = new window.Image();
        img.src = e.target.result as string;
        img.onload = async () => {
          const imageFrame = {
            x: 0,
            y: 0,
            height: img.height,
            width: img.width,
          };
          setLayerFrame(imageFrame);
          const previewSrc = await createImagePreview(img.src, 200, 200);
          const objectId = generateId();
          const layerId = generateId();
          const object: ImageObject = {
            category: "content",
            type: "image",
            src: img.src,
            id: objectId,
            frame: imageFrame,
            cropFrame: imageFrame,
            originalSize: { width: img.width, height: img.height },
            previewSrc,
            originalSrc: `${img.src}`,
          };
          // COMMENT FOR DEV:
          // const detectedObjects = await detectObjects(img.src);
          addLayer({
            name: "layer-1",
            id: layerId,
            type: "content",
            objects: { [objectId]: object },
            objectOrders: [objectId],
          });
          setIsLoading(false);
        };
      }
    };

    if (f) {
      setIsLoading(true);
      reader.readAsDataURL(f);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <Card className="aspect-square h-full">
        <FileDropzone
          className="h-full w-full"
          disabled={isLoading}
          onFileSelected={handleImageFileChange}
        >
          {isLoading ? (
            <LoadingIndicator className="w-10 h-10" />
          ) : (
            <ImagePlus className="w-1/2 h-1/2" />
          )}
        </FileDropzone>
      </Card>
    </div>
  );
};

export default NewProject;
