import { useTheme } from "@images/context/theme/use-theme";
import { useIsMobile } from "@images/hooks/common/use-is-mobile";
import MainMenu from "../mainbar/main-menu";
import HeaderLeft from "./header-left";
import HeaderRight from "./header-right";

const Header = () => {
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  return (
    <header
      className="flex flex-row items-center justify-between gap-2 border-b shadow px-4 fixed left-0 top-0 z-20 w-full h-14 text-balck"
      style={{ backgroundColor: theme.actionbarBgColor }}
    >
      <HeaderLeft />
      {!isMobile && (
        <MainMenu className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[80%]" />
      )}
      <HeaderRight />
    </header>
  );
};

export default Header;
