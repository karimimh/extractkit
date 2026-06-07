"use client";

import { cn } from "@notes/utils/css-utils";
import {
  Children,
  isValidElement,
  type FC,
  type ReactElement,
  type ReactNode,
  useMemo,
  useState,
} from "react";
import Popover from "./popover";
import Input from "./input/input";

interface MultichoiceDropdownProps {
  children: ReactNode;
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  className?: string;
  horizontalContentAlignment?: "left" | "center" | "right";
  searchPlaceholder?: string;
  searchInputClassName?: string;
}

interface MultichoiceDropdownTriggerProps {
  children: ReactNode;
  className?: string;
}

interface MultichoiceDropdownContentProps {
  children: ReactNode;
  className?: string;
}

interface MultichoiceDropdownChoiceProps {
  id: string;
  children: ReactNode;
  className?: string;
  searchText?: string;
}

interface MultichoiceDropdownHeaderProps {
  children: ReactNode;
  className?: string;
}

interface MultichoiceDropdownFooterProps {
  children: ReactNode;
  className?: string;
}

const MultichoiceDropdown: FC<MultichoiceDropdownProps> & {
  Trigger: FC<MultichoiceDropdownTriggerProps>;
  Content: FC<MultichoiceDropdownContentProps>;
  Choice: FC<MultichoiceDropdownChoiceProps>;
  Header: FC<MultichoiceDropdownHeaderProps>;
  Footer: FC<MultichoiceDropdownFooterProps>;
} = ({
  children,
  selectedIds,
  onSelectionChange,
  className,
  horizontalContentAlignment = "left",
  searchPlaceholder = "Search...",
  searchInputClassName,
}: MultichoiceDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const trigger = useMemo(() => {
    return Children.toArray(children)
      .map((child: ReactNode) => {
        if (!isValidElement(child) || typeof child.type === "string") return null;
        if (child.type !== MultichoiceDropdown.Trigger) return null;
        return child as ReactElement<MultichoiceDropdownTriggerProps>;
      })
      .filter(child => Boolean(child))
      .at(0);
  }, [children]);

  const content = useMemo(() => {
    return Children.toArray(children)
      .map((child: ReactNode) => {
        if (!isValidElement(child) || typeof child.type === "string") return null;
        if (child.type !== MultichoiceDropdown.Content) return null;
        return child as ReactElement<MultichoiceDropdownContentProps>;
      })
      .filter(child => Boolean(child))
      .at(0);
  }, [children]);

  const header = useMemo(() => {
    return Children.toArray(children)
      .map((child: ReactNode) => {
        if (!isValidElement(child) || typeof child.type === "string") return null;
        if (child.type !== MultichoiceDropdown.Header) return null;
        return child as ReactElement<MultichoiceDropdownHeaderProps>;
      })
      .filter(child => Boolean(child))
      .at(0);
  }, [children]);

  const footer = useMemo(() => {
    return Children.toArray(children)
      .map((child: ReactNode) => {
        if (!isValidElement(child) || typeof child.type === "string") return null;
        if (child.type !== MultichoiceDropdown.Footer) return null;
        return child as ReactElement<MultichoiceDropdownFooterProps>;
      })
      .filter(child => Boolean(child))
      .at(0);
  }, [children]);

  const choices = useMemo(() => {
    if (!content) return [];
    return Children.toArray(content.props.children)
      .map((child: ReactNode) => {
        if (!isValidElement(child) || typeof child.type === "string") return null;
        if (child.type !== MultichoiceDropdown.Choice) return null;
        const choiceNode = child as ReactElement<MultichoiceDropdownChoiceProps>;
        return {
          id: choiceNode.props.id,
          label: choiceNode.props.children,
          className: choiceNode.props.className,
          searchText: choiceNode.props.searchText,
        };
      })
      .filter(
        (
          child
        ): child is {
          id: string;
          label: ReactNode;
          className: string | undefined;
          searchText: string | undefined;
        } => Boolean(child)
      );
  }, [content]);

  const filteredChoices = useMemo(() => {
    if (!searchQuery) return choices;
    return choices.filter(choice => {
      const textToSearch =
        choice.searchText || (typeof choice.label === "string" ? choice.label : "");
      return textToSearch.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [choices, searchQuery]);

  const handleToggleSelection = (id: string) => {
    setSelectedIds(
      selectedIds.includes(id) ? selectedIds.filter(sid => sid !== id) : [...selectedIds, id]
    );
  };

  const setSelectedIds = (newSelectedIds: string[]) => {
    onSelectionChange(newSelectedIds);
  };

  return (
    <Popover
      className={cn(className)}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      horizontalContentAlignment={horizontalContentAlignment}
    >
      <Popover.Trigger
        className={cn("rounded-md", isOpen && "bg-[var(--bg-tertiary)]", trigger?.props.className)}
      >
        {trigger?.props.children}
      </Popover.Trigger>
      <Popover.Content
        className={cn(
          "rounded-md shadow-md border border-[var(--border-primary)] -translate-y-1 bg-[var(--bg-secondary)] min-w-48",
          content?.props.className
        )}
      >
        <div className="px-2 py-1 border-b border-[var(--border-primary)] flex items-center gap-2">
          {header && <div className={cn(header.props.className)}>{header.props.children}</div>}
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={value => setSearchQuery(value || "")}
            className={searchInputClassName}
          />
        </div>
        <div className="max-h-64 overflow-y-auto">
          {filteredChoices.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-[var(--text-secondary)]">
              No choices found
            </div>
          ) : (
            filteredChoices.map(({ id, label, className: itemClassName }) => (
              <label
                key={id}
                className={cn(
                  "flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-[var(--bg-tertiary)] text-sm",
                  itemClassName
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(id)}
                  onChange={() => handleToggleSelection(id)}
                  className="cursor-pointer"
                />
                <span>{label}</span>
              </label>
            ))
          )}
        </div>
        {footer && (
          <div className={cn("border-t border-[var(--border-primary)]", footer.props.className)}>
            {footer.props.children}
          </div>
        )}
      </Popover.Content>
    </Popover>
  );
};

MultichoiceDropdown.Trigger = function MultichoiceDropdownTrigger({
  children,
}: MultichoiceDropdownTriggerProps) {
  return <>{children}</>;
};

MultichoiceDropdown.Content = function MultichoiceDropdownContent({
  children,
}: MultichoiceDropdownContentProps) {
  return <>{children}</>;
};

MultichoiceDropdown.Choice = function MultichoiceDropdownChoice({
  children,
}: MultichoiceDropdownChoiceProps) {
  return <>{children}</>;
};

MultichoiceDropdown.Header = function MultichoiceDropdownHeader({
  children,
}: MultichoiceDropdownHeaderProps) {
  return <>{children}</>;
};

MultichoiceDropdown.Footer = function MultichoiceDropdownFooter({
  children,
}: MultichoiceDropdownFooterProps) {
  return <>{children}</>;
};

export default MultichoiceDropdown;
