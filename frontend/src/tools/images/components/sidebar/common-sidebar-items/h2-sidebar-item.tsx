import { cn } from "@images/utils/css-utils";

interface H2SidebarItemProps {
  className?: string;
  title: string;
}

const H2SidebarItem = ({ className = "", title }: H2SidebarItemProps) => {
  return (
    <h2
      key={title}
      className={cn(
        "text-lg font-bold pl-4 text-left border-b pb-1",
        className
      )}
    >
      {title}
    </h2>
  );
};

export default H2SidebarItem;
