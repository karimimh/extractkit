import React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@notes/utils/css-utils";
import Button from "./button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
}) => {
  if (totalPages <= 1) {
    return null;
  }

  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 2; // Number of pages to show on each side of current page

    // Always show first page
    pages.push(1);

    // Add ellipsis if there's a gap between 1 and the start of the range
    if (currentPage - delta > 2) {
      pages.push("...");
    }

    // Add pages around current page
    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Add ellipsis if there's a gap between the end of the range and last page
    if (currentPage + delta < totalPages - 1) {
      pages.push("...");
    }

    // Always show last page (if different from first)
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = generatePageNumbers();

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {/* Previous button */}
      <Button
        variant="framed"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1"
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </Button>

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((page, index) => (
          <React.Fragment key={index}>
            {page === "..." ? (
              <span className="px-2 py-1 text-gray-500">
                <MoreHorizontal className="w-4 h-4" />
              </span>
            ) : (
              <Button
                variant={currentPage === page ? "main" : "framed"}
                onClick={() => onPageChange(page as number)}
                className="min-w-[2.5rem]"
              >
                {page}
              </Button>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Next button */}
      <Button
        variant="framed"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1"
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default Pagination;
