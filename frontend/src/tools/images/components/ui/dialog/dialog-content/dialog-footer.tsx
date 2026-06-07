import { cn } from "@images/utils/css-utils";

export type DialogContentFooterProps = React.HTMLAttributes<HTMLDivElement>;

const DialogContentFooter: React.FC<DialogContentFooterProps> = ({
  children,
  className,
  style,
}) => {
  return (
    <div className={cn("p-4", className)} style={style}>
      {children}
    </div>
  );
};

export default DialogContentFooter;
