import React, {
  useState,
  useRef,
  useEffect,
  FC,
  ReactNode,
  MouseEvent,
  CSSProperties,
} from "react";

interface ContextMenuProps {
  children: ReactNode;
}

interface ContextMenuTriggerProps {
  children: ReactNode;
  className?: string;
}

interface ContextMenuContentProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

interface ContextMenuType extends FC<ContextMenuProps> {
  Trigger: FC<ContextMenuTriggerProps>;
  Content: React.ForwardRefExoticComponent<
    ContextMenuContentProps & React.RefAttributes<HTMLDivElement>
  >;
}

const ContextMenu: ContextMenuType = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("click", handleClickOutside as any);
    } else {
      document.removeEventListener("click", handleClickOutside as any);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside as any);
    };
  }, [isOpen]);

  return (
    <>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return null;

        if (child.type === ContextMenu.Trigger) {
          return React.cloneElement(child, {
            onContextMenu: (e: React.MouseEvent) => {
              e.preventDefault();
              setIsOpen(true);
              setPosition({ x: e.clientX, y: e.clientY });
            },
          });
        }

        if (child.type === ContextMenu.Content) {
          return isOpen
            ? React.cloneElement(child, {
                style: {
                  position: "fixed",
                  top: position.y,
                  left: position.x,
                  zIndex: 1000,
                },
                ref: menuRef,
              })
            : null;
        }

        return null;
      })}
    </>
  );
};

ContextMenu.Trigger = function ContextMenuTrigger({
  children,
  onContextMenu,
  className,
}: ContextMenuTriggerProps & { onContextMenu?: (e: MouseEvent) => void }) {
  return (
    <div onContextMenu={onContextMenu} className={className}>
      {children}
    </div>
  );
};

ContextMenu.Content = React.forwardRef<HTMLDivElement, ContextMenuContentProps>(
  function ContextMenuContnt({ children, className, style }, ref) {
    return (
      <div
        ref={ref}
        className={`bg-white shadow-md ${className}`}
        style={style}
      >
        {children}
      </div>
    );
  }
);

export default ContextMenu;
