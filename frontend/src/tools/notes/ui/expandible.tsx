"use client";

import { cn } from "@notes/utils/css-utils";
import {
  Children,
  cloneElement,
  type FC,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import Button, { type ButtonProps } from "./button";

interface ExpandibleProps {
  children: ReactNode;
  className?: string;
  isExpanded?: boolean;
  setIsExpanded?: (value: boolean) => void;
}

type ExpandibleTriggerPrope = ButtonProps;

interface ExpandibleContentProps {
  children: ReactNode;
  className?: string;
}

const Expandible: FC<ExpandibleProps> & {
  Trigger: FC<ExpandibleTriggerPrope>;
  Content: FC<ExpandibleContentProps>;
} = ({
  children,
  className = "",
  isExpanded: controlledExpanded,
  setIsExpanded: controlledSetExpanded,
}) => {
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState<string>();

  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : uncontrolledExpanded;
  const setIsExpanded = (expanded: boolean) => {
    if (!expanded) setTimeout(() => setContentHeight("0"), 150);
    else setContentHeight("auto");
    if (controlledSetExpanded) controlledSetExpanded(expanded);
    else setUncontrolledExpanded(expanded);
  };

  useEffect(() => {
    if (controlledSetExpanded !== undefined) return;
    if (uncontrolledExpanded) setTimeout(() => setContentHeight("0"), 150);
    else setContentHeight("auto");
  }, [controlledSetExpanded, uncontrolledExpanded]);

  const trigger = Children.toArray(children)
    .map((child: ReactNode) => {
      if (!isValidElement(child) || typeof child.type === "string") return null;
      if (child.type.name !== Expandible.Trigger.name) return null;

      const triggerNode = child as ReactElement<ExpandibleTriggerPrope>;
      const triggerProps = triggerNode.props;

      return cloneElement(triggerNode, {
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
          triggerProps.onClick?.(e);
          setIsExpanded(!isExpanded);
        },
      });
    })
    ?.filter(child => Boolean(child))
    .at(0);

  const content = Children.map(children, child => {
    if (!isValidElement(child) || typeof child.type === "string") return null;
    if (child.type.name !== Expandible.Content.name) return null;
    return child;
  })
    ?.filter(child => Boolean(child))
    .at(0);

  const contentClassName = useMemo(() => {
    return (content?.props as ExpandibleContentProps).className;
  }, [content?.props]);

  return (
    <div className={cn("", className)}>
      {trigger}
      <div
        className={cn(
          "transition-[transform_opacity] overflow-hidden ease-out origin-top",
          contentClassName
        )}
        style={{
          height: contentHeight,
          opacity: isExpanded ? 100 : 0,
          transform: isExpanded ? "scaleY(1)" : "scaleY(0)",
        }}
      >
        {contentHeight === "auto" ? (content?.props as ExpandibleContentProps).children : null}
      </div>
    </div>
  );
};

Expandible.Trigger = function ExpandibleTrigger(props: ExpandibleTriggerPrope) {
  return <Button {...props} />;
};

Expandible.Content = function ExpandibleContent({ children }: ExpandibleContentProps) {
  return <Fragment>{children}</Fragment>;
};

export default Expandible;
