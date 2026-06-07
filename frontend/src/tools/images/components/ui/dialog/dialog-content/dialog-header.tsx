import { cn } from "@images/utils/css-utils";

export type DialogContentHeaderProps = React.HTMLAttributes<HTMLDivElement>;

const DialogContentHeader = ({ children, className, style }: DialogContentHeaderProps) => {
  return (
    <div className={cn("p-4", className)} style={style}>
      {children}
    </div>
  );
};

export default DialogContentHeader;
