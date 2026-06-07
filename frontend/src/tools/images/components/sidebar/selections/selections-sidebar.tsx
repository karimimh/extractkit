import Select from "@images/components/ui/select";
import { useUIActions } from "@images/context/ui/actions";
import { useUIContext } from "@images/context/ui/use-ui-context";
import { SelectionType } from "@images/types/selection-types";
import H2SidebarItem from "../common-sidebar-items/h2-sidebar-item";

interface SelectionsSidebarProps {}

const SelectionsSidebar = ({}: SelectionsSidebarProps) => {
  const { selectionType } = useUIContext();
  const { setSelectionType } = useUIActions();

  return (
    <>
      <H2SidebarItem title="Selection Tool" />
      <Select
        trigger={selectionType ?? "Select ..."}
        items={["rectangle", "ellipse", "polygon", "path", "freeform", "brush"]}
        onSelect={v => setSelectionType(v as SelectionType)}
        contentClassName="text-base"
        className="w-full"
        triggerClassName="w-full"
      />
    </>
  );
};

export default SelectionsSidebar;
