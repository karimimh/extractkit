import { useAuth } from "@notes/hooks/use-auth";
import { useIsMobile } from "@notes/hooks/use-is-mobile";
import Button from "@notes/ui/button";
import { cn } from "@notes/utils/css-utils";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LabelFilter } from "../labels";
import CreateNoteForm from "../notes/create-note/create-note-form";
import type { SortOption } from "../sort-options-selector";
import SortOptionsSelector from "../sort-options-selector";
import { UpgradeDialog } from "../subscription/UpgradeDialog";
import AiAssistantButton from "./ai-assistant-button";
import HeaderMenu from "./header-menu";
import SearchBar from "./SearchBar";

interface HeaderProps {
  onSearch: (query: string) => void;
  onNoteCreated?: () => void;
  selectedLabelIds: number[];
  onLabelChange: (labelIds: number[]) => void;
  currentSort?: SortOption;
  onSortChange?: (sort: SortOption) => void;
  onRefetch: () => void;
  isLoading?: boolean;
  totalNotesCount: number;
  aiAssistantOpen: boolean;
  setAiAssistantOpen: (open: boolean) => void;
  isPro: boolean;
}

const Header: React.FC<HeaderProps> = ({
  onSearch,
  onNoteCreated,
  selectedLabelIds,
  onLabelChange,
  currentSort,
  onSortChange,
  onRefetch,
  isLoading = false,
  totalNotesCount,
  aiAssistantOpen,
  setAiAssistantOpen,
  isPro,
}) => {
  const { isAuthenticated } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <svg className="w-0 h-0 absolute">
        <defs>
          <clipPath id="zigzag-clip" clipPathUnits="objectBoundingBox">
            <polygon
              points="
              0,0 0,0.95
              0.02,1 0.04,0.95 0.06,1 0.08,0.95 0.10,1 0.12,0.95 0.14,1 0.16,0.95 0.18,1 0.20,0.95 0.22,1 0.24,0.95 0.26,1 0.28,0.95 0.30,1
              0.32,0.95 0.34,1 0.36,0.95 0.38,1 0.40,0.95 0.42,1 0.44,0.95 0.46,1 0.48,0.95 0.50,1 0.52,0.95 0.54,1 0.56,0.95 0.58,1 0.60,0.95
              0.62,1 0.64,0.95 0.66,1 0.68,0.95 0.70,1 0.72,0.95 0.74,1 0.76,0.95 0.78,1 0.80,0.95 0.82,1 0.84,0.95 0.86,1 0.88,0.95 0.90,1
              0.92,0.95 0.94,1 0.96,0.95 0.98,1 1,0.95
              1,0
            "
            />
          </clipPath>
        </defs>
      </svg>
      <header
        className={cn(
          "bg-[var(--bg-header)] fixed top-0 left-0 w-full z-50",
          isScrolled && "shadow-md"
        )}
        style={{ clipPath: "url(#zigzag-clip)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex-1 flex items-center gap-4">
              <h1 className="text-2xl font-bold text-neon-blue font-family-jetbrains select-none">
                NoteMD
              </h1>
            </div>
            {isAuthenticated && onNoteCreated && (
              <div className="flex-1 max-w-md hidden sm:block">
                <CreateNoteForm onNoteCreated={onNoteCreated} />
              </div>
            )}
            <nav className="flex-1 flex flex-row-reverse items-center gap-2 space-x-4">
              {isAuthenticated ? (
                <>
                  <HeaderMenu />
                  {isPro ? (
                    <div className="flex-1 hidden sm:flex justify-end items-center">
                      <AiAssistantButton
                        isMobile={isMobile}
                        aiAssistantOpen={aiAssistantOpen}
                        setAiAssistantOpen={setAiAssistantOpen}
                      />
                    </div>
                  ) : (
                    <UpgradeDialog onOpenChange={setUpgradeDialogOpen} open={upgradeDialogOpen} />
                  )}
                  <SearchBar
                    onSearch={onSearch}
                    className="flex h-10 sm:hidden items-center mx-1 max-w-md"
                  />
                </>
              ) : (
                <>
                  <Link
                    to="/notes/login"
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/notes/register"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
        {isAuthenticated && (
          <div
            className={cn(
              "flex items-center justify-between gap-4 z-10 pb-3 transition-shadow duration-200"
              // isScrolled && "shadow-md"
            )}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-evenly gap-4">
              <div className="flex items-center gap-3 flex-1">
                <LabelFilter
                  className=""
                  selectedLabelIds={selectedLabelIds}
                  onLabelChange={onLabelChange}
                />
                <div className="text-sm text-[var(--text-secondary)] whitespace-nowrap flex-1 flex items-center gap-2">
                  <span>
                    {totalNotesCount} {totalNotesCount === 1 ? "note" : "notes"}
                  </span>
                  <Button
                    variant="plain"
                    icon={RefreshCw}
                    onClick={() => onRefetch()}
                    className={cn("p-1 hover:bg-[var(--bg-secondary)] rounded transition-colors")}
                    iconClassName={cn(isLoading && "animate-spin")}
                    title="Refresh notes"
                  />
                </div>
              </div>

              <SearchBar
                onSearch={onSearch}
                className="hidden h-10 sm:flex items-center mx-1 max-w-md"
              />

              <div className="flex flex-row-reverse items-center justify-normal gap-6 flex-1">
                <SortOptionsSelector currentSort={currentSort} onSortChange={onSortChange} />
              </div>
            </div>
          </div>
        )}
        {/* <svg
          className="absolute bottom-0 left-0 w-full h-5 pointer-events-none text-[var(--border-primary)] -scale-100 translate-y-2"
          viewBox="0 -3 100 10"
          preserveAspectRatio="none"
        >
          <polyline
            points="
              0,5 2,0 4,5 6,0 8,5 10,0 12,5 14,0 16,5 18,0 20,5 22,0 24,5 26,0 28,5 30,0
              32,5 34,0 36,5 38,0 40,5 42,0 44,5 46,0 48,5 50,0 52,5 54,0 56,5 58,0 60,5
              62,0 64,5 66,0 68,5 70,0 72,5 74,0 76,5 78,0 80,5 82,0 84,5 86,0 88,5 90,0
              92,5 94,0 96,5 98,0 100,5
            "
            fill="none"
            stroke="currentColor"
            strokeLinejoin="miter"
            strokeWidth={1}
          />
        </svg> */}
      </header>
      <div className="h-36 w-full" />
    </>
  );
};

export default Header;
