import Button from "@images/components/ui/button";
import Dialog from "@images/components/ui/dialog/dialog";
import AutogrowingTextarea, {
  AutogrowingTextareaHandle,
} from "@images/components/ui/input/auto-growing-text-area";
import NumberInput from "@images/components/ui/input/number-input";
import Select from "@images/components/ui/select";
import ColorPickerPopover from "@images/components/ui/color/color-picker-popover";
import { useLayersContext } from "@images/context/layers/use-layers-context";
import { useUIActions } from "@images/context/ui/actions";
import { useUIContext } from "@images/context/ui/use-ui-context";
import { TextObject, TextProperties } from "@images/types/layer-types";
import { generateId } from "@images/utils/object-utils";
import { measureTextSize } from "@images/utils/text-utils";
import { parseInteger } from "@images/utils/ui-utils";
import { TypeOutlineIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const AVAILABLE_FONTS = ["Arial", "Courier New", "Georgia", "Times New Roman", "Verdana"];

const TextDialog = () => {
  const { setSelectedMenu } = useUIActions();
  const { layerFrame } = useUIContext();
  const { selectedLayerId, addLayer, layerOrders } = useLayersContext();

  const [isOpen, setIsOpen] = useState(false);

  const defaultTextProps: TextProperties = {
    content: "",
    fontFamily: "Arial",
    textColor: "black",
    fontSize: layerFrame?.width ? Math.round(0.025 * layerFrame.width) : undefined,
  };
  const [textProps, setTextProps] = useState<TextProperties>(defaultTextProps);
  const textareaRef = useRef<AutogrowingTextareaHandle>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  const handleOk = () => {
    if (textProps.content && layerFrame && selectedLayerId) {
      const id = generateId();
      // given the text properties, calculate the fitting frame in canvas
      const textSize = measureTextSize(textProps, layerFrame);

      const textFrame = parseInteger({
        x: layerFrame.x + layerFrame.width / 2 - textSize.width / 2 - 10,
        y: layerFrame.y + layerFrame.height / 2 - textSize.height / 2 - 10,
        width: textSize.width + 20,
        height: textSize.height + 20,
      });
      const textObject: TextObject = {
        type: "text",
        category: "content",
        id: id,
        frame: textFrame,
        text: { ...textProps },
      };
      addLayer({
        id: generateId(),
        name: `layer-${layerOrders.length + 1}`,
        type: "content",
        objectOrders: [id],
        objects: { [id]: textObject },
      });
    }
    setIsOpen(false);
    setTextProps(defaultTextProps);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={open => {
        setIsOpen(open);
        if (!open) {
          setTextProps(defaultTextProps);
        }
      }}
    >
      <Dialog.Trigger
        className="p-1 rounded"
        onClick={() => {
          setSelectedMenu("text");
        }}
        variant="plain"
        disabled={!layerFrame}
      >
        <TypeOutlineIcon className="size-6" />
      </Dialog.Trigger>
      <Dialog.Content className="w-[90vw] max-w-5xl max-h-[90vh] flex flex-col shadow-lg border">
        <Dialog.Content.Header className="border-b">Insert Text</Dialog.Content.Header>

        <div className="flex-1 p-4 flex flex-col gap-4">
          <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">Font Family:</label>
            <Select
              trigger={textProps.fontFamily || "Arial"}
              items={AVAILABLE_FONTS}
              onSelect={value => {
                setTextProps(prev => ({ ...prev, fontFamily: value || "Arial" }));
              }}
            />

            <label className="text-sm font-medium text-gray-700">Font Size:</label>
            <NumberInput
              value={textProps.fontSize}
              onChange={value => {
                setTextProps(prev => ({ ...prev, fontSize: value }));
              }}
              min={8}
              max={8}
            />

            <label className="text-sm font-medium text-gray-700">Text Color:</label>
            <ColorPickerPopover
              value={textProps.textColor}
              onChange={value => {
                setTextProps(prev => ({ ...prev, textColor: value || "black" }));
              }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Content:</label>
            <AutogrowingTextarea
              className="w-full min-h-7 bg-transparent border border-gray-300 rounded-md p-2"
              onChange={text => {
                setTextProps(prev => ({ ...prev, content: text }));
              }}
              minRows={10}
              maxRows={40}
              placeholder="Enter text"
              ref={textareaRef}
              value={textProps.content}
            />
          </div>
        </div>
        <Dialog.Content.Footer className="flex gap-2 justify-end border-t">
          <Button className="mt-4" variant="main" text="Insert" onClick={handleOk} />
        </Dialog.Content.Footer>
      </Dialog.Content>
    </Dialog>
  );
};

export default TextDialog;
