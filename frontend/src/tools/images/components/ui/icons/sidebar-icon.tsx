interface SidebarIconProps {
  isOpen: boolean;
  side: "left" | "right";
}

const SidebarIcon = ({ isOpen, side = "left" }: SidebarIconProps) => {
  const isLeft = side === "left";
  return (
    <svg
      className="w-5 h-5"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      {isLeft ? (
        <rect
          width="6"
          height="18"
          x="3"
          y="3"
          rx="2"
          fill={isOpen ? "black" : "none"}
        />
      ) : (
        <rect
          width="6"
          height="18"
          x="15"
          y="3"
          rx="2"
          fill={isOpen ? "black" : "none"}
        />
      )}
    </svg>
  );
};

export default SidebarIcon;
