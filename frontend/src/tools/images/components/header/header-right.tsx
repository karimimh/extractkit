import { useLayersContext } from "@images/context/layers/use-layers-context";
import { useUIActions } from "@images/context/ui/actions";
import { useUIContext } from "@images/context/ui/use-ui-context";
import { Bolt, History, Redo2, Undo2 } from "lucide-react";
import SidebarButton from "../sidebar/sidebar-button";
import Button from "../ui/button";
import Dialog from "../ui/dialog/dialog";
import InputWithPlusMinus from "../ui/input/input-with-plus-minus";
import Popover from "../ui/popover";
import Select from "../ui/select";

const HeaderRight = () => {
  const { isSnapEnabled, grid, layerFrame } = useUIContext();
  const { setIsSnapEnabled, setGrid } = useUIActions();
  const { canRedo, canUndo, redo, undo, history } = useLayersContext();

  return (
    <div className="flex flex-row-reverse items-center gap-2">
      <Dialog>
        <Dialog.Trigger
          className="p-1"
          disabled={!layerFrame}
          icon={Bolt}
          iconSize="5"
          variant="plain"
        />
        <Dialog.Content className="w-full sm:w-[40rem] sm:shadow-lg">
          <Dialog.Content.Header className="shadow font-bold">Settings</Dialog.Content.Header>
          <div className="mt-2 grid grid-cols-2 place-items-start gap-2 p-4">
            <label htmlFor="snap-toggle">Enable Snap to Grid</label>
            <input
              id="snap-toggle"
              type="checkbox"
              checked={isSnapEnabled}
              onChange={() => setIsSnapEnabled(!isSnapEnabled)}
            />
            <div>Show Grid</div>
            <Select
              items={["hide", "always-show", "show-when-drawing"]}
              trigger={grid.status}
              className="w-32"
              onSelect={value => {
                return setGrid({
                  rows: grid.rows,
                  columns: grid.columns,
                  status: value as "always-show" | "show-when-drawing" | "hide",
                });
              }}
            />
            <div>Rows</div>
            <InputWithPlusMinus
              className="w-32 h-7"
              initialValue={10}
              min={2}
              max={100}
              onChange={value => setGrid({ ...grid, rows: value })}
            />
            <div>Columns</div>
            <InputWithPlusMinus
              className="w-32 h-7"
              initialValue={10}
              min={2}
              max={100}
              onChange={value => setGrid({ ...grid, columns: value })}
            />
          </div>
        </Dialog.Content>
      </Dialog>
      <Popover>
        <Popover.Trigger
          disabled={!canRedo && !canUndo}
          icon={History}
          iconSize="5"
          variant="plain"
          className="mr-4"
        />
        <Popover.Content className="mt-2 rounded-lg shadow-lg flex flex-col border">
          <div className="flex flex-row items-center w-full border-b py-2 px-4">
            <Button
              className="flex-1 flex items-center justify-center"
              disabled={!canUndo}
              icon={Undo2}
              iconSize="5"
              variant="plain"
              onClick={undo}
            />
            <Button
              className="flex-1 flex items-center justify-center"
              disabled={!canRedo}
              icon={Redo2}
              iconSize="5"
              variant="plain"
              onClick={redo}
            />
          </div>
          <div className="w-full max-h-80 overflow-y-auto">
            {history.length === 0 && <div className="w-full p-4">No history available</div>}
            {history.length > 0 && (
              <ul className="max-h-64 overflow-y-auto pt-2">
                {history
                  .slice()
                  .reverse()
                  .map((entry, index) => (
                    <li key={index} className="mb-2 border-b pb-1 px-4 text-sm">
                      <div className="font-medium">{entry.description}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </Popover.Content>
      </Popover>
      <SidebarButton className="flex sm:hidden px-1 text-blue-600" />
    </div>
  );
};

export default HeaderRight;
