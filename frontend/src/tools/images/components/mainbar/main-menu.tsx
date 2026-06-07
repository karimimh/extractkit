import { useUIActions } from "@images/context/ui/actions";
import { useUIContext } from "@images/context/ui/use-ui-context";
import { useEffect, useState } from "react";
import Cucumber from "../ui/cucumber";
import AdjustmentsDialog from "./adjustments-dialog";
import ColorizationsDialog from "./colorizations-dialog";
import FiltersDialog from "./filters-dialog";
import DrawMenuItem from "./main-menu-items/draw-menu-item";
import ShapesMenuItem from "./main-menu-items/shapes-menu-item";
import SubMenus from "./main-menu-items/submenus";
import TextDialog from "./main-menu-items/text-dialog";

interface MainMenuProps {
  className?: string;
}

const MainMenu = ({ className }: MainMenuProps) => {
  const { selectedTool, selectedMenu } = useUIContext();
  const { setSelectedTool } = useUIActions();
  const [isAdjustmentsDialogOpen, setIsAdjustmentsDialogOpen] = useState(false);
  const [isColorizationsDialogOpen, setIsColorizationsDialogOpen] = useState(false);
  const [isFiltersDialogOpen, setIsFiltersDialogOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedTool && selectedTool.type !== "path") {
        setSelectedTool(undefined);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedTool, setSelectedTool]);

  return (
    <Cucumber className={`border ${className}`}>
      {["shapes", "draw"].includes(selectedMenu ?? "") ? (
        <SubMenus menuType={selectedMenu as "shapes" | "draw"} />
      ) : (
        <div className="flex items-center justify-center gap-0">
          {/* <AiMenuItem /> */}
          <AdjustmentsDialog
            isOpen={isAdjustmentsDialogOpen}
            onOpenChange={setIsAdjustmentsDialogOpen}
          />
          <ColorizationsDialog
            isOpen={isColorizationsDialogOpen}
            onOpenChange={setIsColorizationsDialogOpen}
          />
          <FiltersDialog isOpen={isFiltersDialogOpen} onOpenChange={setIsFiltersDialogOpen} />
          <TextDialog />
          <ShapesMenuItem />
          <DrawMenuItem />
        </div>
      )}
    </Cucumber>
  );
};

export default MainMenu;
