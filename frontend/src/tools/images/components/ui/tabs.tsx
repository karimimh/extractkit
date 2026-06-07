
import { cn } from "@images/utils/css-utils";
import type { FC, ReactElement, ReactNode } from "react";
import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Button, { ButtonProps } from "./button";

interface TabsProps {
  children: ReactNode;
  className?: string;
  triggerContainerClassName?: string;
  contentContainerClassName?: string;
  selectedIndex?: number;
  hideOutOfViewTabContents?: boolean;
}

const Tabs: FC<TabsProps> & {
  Content: FC<TabContentProps>;
  Trigger: FC<TabTriggerProps>;
} = ({
  children,
  className,
  triggerContainerClassName,
  contentContainerClassName,
  selectedIndex: controlledSelectedIndex,
  hideOutOfViewTabContents = true,
}: TabsProps & { selectedIndex?: number }) => {
  const [internalSelectedIndex, setInternalSelectedIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const triggerContainerRef = useRef<HTMLDivElement>(null);

  const selectedIndex = controlledSelectedIndex ?? internalSelectedIndex;

  useEffect(() => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
    }, 150);
  }, [selectedIndex]);

  const handleTabClick = useCallback(
    (index: number) => {
      if (controlledSelectedIndex === undefined) {
        setInternalSelectedIndex(index);
      }
    },
    [controlledSelectedIndex]
  );

  const triggers = useMemo(() => {
    return Children.map(children, (child, index) => {
      if (!isValidElement(child) || typeof child.type === "string") return null;
      if (child.type.name !== Tabs.Trigger.name) return null;
      const triggerNode = child as ReactElement<TabTriggerProps>;
      const triggerProps = triggerNode.props;

      return cloneElement(triggerNode, {
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
          triggerProps.onClick?.(e);
          handleTabClick(index);
        },
        className: cn(
          "py-2 px-4 border-b-2 text-sm font-medium",
          triggerProps.className,
          selectedIndex === index && "border-blue-500 text-blue-500",
          selectedIndex === index && triggerProps.activeClassName,
          selectedIndex !== index && "border-transparent text-gray-500",
          selectedIndex !== index && triggerProps.deactiveClassName
        ),
      });
    })?.filter((child) => Boolean(child));
  }, [children, handleTabClick, selectedIndex]);

  const contents = useMemo(() => {
    return Children.map(children, (child, index) => {
      if (!isValidElement(child) || typeof child.type === "string") return null;
      if (child.type.name !== Tabs.Content.name) return null;
      return child;
    })?.filter((child) => Boolean(child));
  }, [children]);

  return (
    <div className={cn(className)}>
      {(triggers ?? []).length > 0 && (
        <div
          className={cn(
            "flex flex-row items-center border-b w-full",
            triggerContainerClassName
          )}
          ref={triggerContainerRef}
        >
          {triggers}
        </div>
      )}
      <div
        className={cn(
          "relative overflow-x-clip w-full",
          contentContainerClassName
        )}
      >
        {contents?.map((tab, index) => (
          <div
            className={cn(
              "absolute top-0 left-0 w-full h-fit transform transition-transform ease-out",
              tab.props.className as string | undefined
            )}
            key={tab.key}
            style={{
              transform: `translateX(${(index - selectedIndex) * 100}%)`,
            }}
          >
            {index === selectedIndex ||
            (index === selectedIndex - 1 && isAnimating) ||
            (index === selectedIndex + 1 && isAnimating) ||
            !hideOutOfViewTabContents
              ? tab.props.children
              : null}
          </div>
        ))}
      </div>
    </div>
  );
};

type TabTriggerProps = ButtonProps & {
  activeClassName?: string;
  deactiveClassName?: string;
};

Tabs.Trigger = function TabTrigger(props: TabTriggerProps) {
  return <Button {...props} />;
};

interface TabContentProps {
  children?: React.ReactNode;
  className?: string;
  key: string;
}

Tabs.Content = function TabContent({ children }: TabContentProps) {
  return <>{children}</>;
};

export default Tabs;
