import { useLayersContext } from "@images/context/layers/use-layers-context";
import { useUIActions } from "@images/context/ui/actions";
import { useUIContext } from "@images/context/ui/use-ui-context";
import useThrottle from "@images/hooks/common/use-throttle";
import { cn } from "@images/utils/css-utils";
import { ChevronLeft, Pin } from "lucide-react";
import { useState } from "react";
import ObjectSettings from "../toolbar/object-settings";
import Button from "../ui/button";
import Tabs from "../ui/tabs";
import LayersList from "./explorer/layers-list";
import SidebarButton from "./sidebar-button";

export default function Sidebar() {
  const { isSidebarOpen, sidebarLayerId, sidebarObjectId, isSidebarPinned } = useUIContext();
  const { setSidebarObject, toggleSidebarPinned } = useUIActions();
  const { layers, modifyObject } = useLayersContext();
  const layer = sidebarLayerId ? layers[sidebarLayerId] : undefined;
  const expandedObject = sidebarObjectId ? layer?.objects?.[sidebarObjectId] : undefined;
  const isExpandedObjectImage = expandedObject?.type === "image";
  const [openIndices, setOpenIndices] = useState<number[]>([]);
  const throttledExpandedObject = useThrottle(expandedObject, 500);

  return (
    <>
      <SidebarButton
        className={cn(
          "hidden sm:flex absolute left-4 z-20 px-1 text-blue-600",
          isSidebarPinned ? "top-[3.75rem] left-2" : "top-[4.25rem] left-4"
        )}
      />
      <aside
        className={cn(
          "w-[18rem] z-10 fixed transition-transform ease-out transform flex flex-col justify-start items-stretch overflow-y-auto bg-white",
          isSidebarPinned
            ? "left-0 top-14 bottom-0 rounded-none shadow-lg"
            : "left-2 top-16 bottom-2 shadow-2xl rounded-xl",
          isSidebarOpen ? "translate-x-0" : "translate-x-[-22rem]"
        )}
      >
        <Button
          className={cn("absolute right-2 top-2 z-30 p-1.5", isSidebarPinned && "rotate-90")}
          icon={Pin}
          iconSize="4"
          variant="plain"
          onClick={toggleSidebarPinned}
        />
        <Tabs
          className="w-full h-full"
          contentContainerClassName="h-full"
          selectedIndex={expandedObject ? 1 : 0}
          hideOutOfViewTabContents={false}
        >
          <Tabs.Content key="layers-sidebar">
            <LayersList
              onObjectSelect={setSidebarObject}
              openIndices={openIndices}
              setOpenIndices={setOpenIndices}
            />
          </Tabs.Content>
          <Tabs.Content key="object-sidebar" className="">
            <div className="h-10 w-full sm:pl-10 px-2 border-b flex items-center">
              <Button
                className="text-slate-600"
                icon={ChevronLeft}
                iconSize="6"
                variant="plain"
                text="Back"
                onClick={() => setSidebarObject(undefined, undefined)}
              />
            </div>
            {isExpandedObjectImage && sidebarLayerId ? (
              <ObjectSettings
                object={expandedObject}
                objectType="image"
                modifyObject={newObject => modifyObject(sidebarLayerId, newObject)}
              />
            ) : throttledExpandedObject && sidebarLayerId ? (
              <ObjectSettings
                object={throttledExpandedObject}
                modifyObject={newObject => modifyObject(sidebarLayerId, newObject)}
                objectType={throttledExpandedObject.type} // TODO
              />
            ) : null}
          </Tabs.Content>
        </Tabs>
      </aside>
    </>
  );
}
