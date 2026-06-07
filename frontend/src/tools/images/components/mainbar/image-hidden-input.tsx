
import { Rect } from "@images/types/geometry-types";
import { ImageObject } from "@images/types/layer-types";
import { transferToOrigin } from "@images/utils/math-utils";
import { generateId } from "@images/utils/object-utils";

interface ImageHiddenInputProps {
  layerFrame: Rect;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onNewObject?: (object: ImageObject) => void;
}

const ImageHiddenInput = ({
  layerFrame,
  fileInputRef,
  onNewObject,
}: ImageHiddenInputProps) => {
  return (
    <input
      hidden
      onChange={(e) => {
        if (!e.target.files || !e.target.files[0]) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          if (!event.target?.result) return;
          const src = event.target.result as string;
          const img = new window.Image();
          img.src = src;

          img.onload = async () => {
            const { width, height } = img;
            const ar = width / height;
            const h = layerFrame.height / 2;
            const w = h * ar;
            const centeredFrame: Rect = {
              x: layerFrame.width / 2 - w / 2,
              y: layerFrame.height / 2 - h / 2,
              width: w,
              height: h,
            };
            const imageObject: ImageObject = {
              type: "image",
              frame: centeredFrame,
              cropFrame: transferToOrigin(centeredFrame),
              originalSize: { width, height },
              id: generateId(),
              src,
              originalSrc: src,
            };
            onNewObject?.(imageObject);
          };
        };

        reader.readAsDataURL(e.target.files[0]);
      }}
      ref={fileInputRef}
      type="file"
      accept={".jpg, .jpeg, .png"}
    />
  );
};

export default ImageHiddenInput;
