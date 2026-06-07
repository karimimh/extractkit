
import { cn } from "@images/utils/css-utils";
import { ChevronRight } from "lucide-react";
import {
  Children,
  cloneElement,
  Dispatch,
  FC,
  isValidElement,
  ReactElement,
  ReactNode,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";

interface AccordionTriggerProps {
  children: ReactNode;
  className?: string;
  isOpen?: boolean;
  onToggle?: () => void;
  expandable?: boolean;
}

interface AccordionContentProps {
  children: ReactNode;
  className?: string;
}

interface AccordionItemProps {
  children: ReactNode;
  className?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

interface AccordionItemType extends FC<AccordionItemProps> {
  Trigger: FC<AccordionTriggerProps>;
  Content: FC<AccordionContentProps>;
}

interface AccordionProps {
  children: ReactNode;
  className?: string;
  openIndices?: number[];
  setOpenIndices?: Dispatch<SetStateAction<number[]>>;
}

interface AccordionType extends FC<AccordionProps> {
  Item: AccordionItemType;
}

const Accordion: AccordionType = ({
  children,
  className,
  openIndices: controlledOpenIndices,
  setOpenIndices: controlledSetOpenIndices,
}) => {
  const [internalOpenIndices, setInternalOpenIndices] = useState<number[]>([]);
  const openIndices = controlledOpenIndices ?? internalOpenIndices;
  const setOpenIndices = controlledSetOpenIndices ?? setInternalOpenIndices;

  const handleAccordionToggle = useCallback(
    (index: number) => {
      setOpenIndices((prev) => {
        if (prev.includes(index)) {
          return prev.filter((i) => i !== index);
        }
        return prev.concat(index);
      });
    },
    [setOpenIndices]
  );

  const items = useMemo(
    () =>
      Children.toArray(children)
        .map((child, index) => {
          if (!isValidElement(child) || typeof child.type === "string")
            return null;
          if (child.type.name !== Accordion.Item.name) return null;
          return cloneElement(
            child as ReactElement<AccordionItemProps>,
            {
              isOpen: openIndices.includes(index),
              onToggle: () => handleAccordionToggle(index),
              index,
            } as Partial<AccordionItemProps>
          );
        })
        .filter((child) => Boolean(child)),
    [children, handleAccordionToggle, openIndices]
  );

  return <div className={className}>{items}</div>;
};

const AccordionItem: AccordionItemType = function AccordionItem({
  children,
  className,
  isOpen = false,
  onToggle,
}: AccordionItemProps) {
  let trigger: ReactElement | null = null;
  let content: ReactElement | null = null;

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === Accordion.Item.Trigger) {
      trigger = cloneElement(child, {
        isOpen,
        onToggle,
      } as Partial<AccordionTriggerProps>);
    } else if (child.type === Accordion.Item.Content) {
      content = child;
    }
  });

  return (
    <div className={className}>
      {trigger}
      <div
        className={cn(
          "overflow-clip transition-all",
          isOpen ? "max-h-screen" : "max-h-0"
        )}
      >
        {content}
      </div>
    </div>
  );
};

const AccordionTrigger: FC<AccordionTriggerProps> = function AccordionTrigger({
  children,
  className,
  isOpen = false,
  onToggle,
  expandable = true,
}) {
  return (
    <div className={`flex items-center ${className}`}>
      <button
        onClick={expandable ? onToggle : undefined}
        className="mr-2 focus:outline-none"
      >
        <ChevronRight
          className={cn(
            "size-4 transition-transform transform rotate-0",
            isOpen && "rotate-90",
            !expandable && "opacity-0"
          )}
        />
      </button>
      <div className="flex-1 text-left">{children}</div>
    </div>
  );
};

const AccordionContent: FC<AccordionContentProps> = function AccordionContent({
  children,
  className,
}) {
  return <div className={className}>{children}</div>;
};

AccordionItem.Trigger = AccordionTrigger;
AccordionItem.Content = AccordionContent;
Accordion.Item = AccordionItem;

export default Accordion;
