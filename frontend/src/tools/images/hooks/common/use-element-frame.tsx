import { Rect } from "@images/types/geometry-types";
import { domRectToRect } from "@images/utils/math-utils";
import { RefObject, useEffect, useState } from "react";

function useElementFrame(elementRef: RefObject<HTMLElement| null>) {
  const [elementFrame, setElementFrame] = useState<Rect | undefined>();

  useEffect(() => {
    const updateElementFrame = () => {
      const elementBounds = elementRef.current?.getBoundingClientRect();
      if (!elementBounds) return;
      setElementFrame(domRectToRect(elementBounds));
    };

    updateElementFrame();
    window.addEventListener("resize", updateElementFrame);
    return () => {
      window.removeEventListener("resize", updateElementFrame);
    };
  }, [elementRef]);

  return elementFrame;
}

export default useElementFrame;
