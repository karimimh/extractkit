import { cn } from "@images/utils/css-utils";

export type DialogExtraControlsProps = React.HTMLAttributes<HTMLDivElement>;

const DialogExtraControls: React.FC<DialogExtraControlsProps> = ({
  children,
  className,
  style,
}) => {
  return (
    <div className={cn("flex items-center gap-2", className)} style={style}>
      {children}
    </div>
  );
};

export default DialogExtraControls;
