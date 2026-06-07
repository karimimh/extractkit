interface H3SidebarItemProps {
  title: string;
}

const H3SidebarItem = ({ title }: H3SidebarItemProps) => {
  return (
    <h3 key={title} className="text-base ml-6 text-left border-b pb-1">
      {title}
    </h3>
  );
};

export default H3SidebarItem;
