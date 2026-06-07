import { useUIContext } from "@images/context/ui/use-ui-context";
import { useIsMobile } from "@images/hooks/common/use-is-mobile";
import { cn } from "@images/utils/css-utils";
import { useMemo } from "react";
import LayersContainer from "../layers/layers-container";
import MainMenu from "../mainbar/main-menu";
import NewProject from "./new-project";

export default function MainArea() {
  const { layerFrame, isSnapEnabled, grid, isSidebarPinned, isSidebarOpen } = useUIContext();
  const { selectedMenu } = useUIContext();
  const isMobile = useIsMobile();
  const isDrawerOpen = useMemo(() => {
    return ["adjustments", "colors", "filters"].includes(selectedMenu ?? "");
  }, [selectedMenu]);

  return (
    <main
      className={cn(
        "bottom-0 fixed top-14 bg-[#EBECF0] right-0 p-2",
        isSidebarPinned && isSidebarOpen ? "left-[18rem]" : "left-0"
      )}
    >
      {layerFrame ? (
        <>
          {isMobile && (
            <MainMenu
              className={cn(
                "absolute z-10 left-1/2 transition-transform transform top-2 -translate-x-1/2 max-w-[calc(100%-1rem)] bg-white ease-out",
                isDrawerOpen ? "translate-y-0" : "translate-y-[calc(100vh-7.5rem)]"
              )}
            />
          )}
          <div className="flex items-center justify-center w-full h-full">
            <LayersContainer layerFrame={layerFrame} isSnapEnabled={isSnapEnabled} grid={grid} />
          </div>
        </>
      ) : (
        <NewProject />
      )}
    </main>
  );
}
