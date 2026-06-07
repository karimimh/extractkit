import React, { useCallback, useEffect, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface ScrollButtonsProps {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

const ScrollButtons: React.FC<ScrollButtonsProps> = ({ scrollContainerRef }) => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const checkScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isScrollable = scrollHeight > clientHeight;

    setShowScrollTop(scrollTop > 0);
    setShowScrollBottom(isScrollable && scrollTop + clientHeight < scrollHeight - 5);
  }, [scrollContainerRef]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScrollPosition();
    container.addEventListener("scroll", checkScrollPosition);

    const resizeObserver = new ResizeObserver(checkScrollPosition);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", checkScrollPosition);
      resizeObserver.disconnect();
    };
  }, [checkScrollPosition, scrollContainerRef]);

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    scrollContainerRef.current?.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  return (
    <>
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="absolute bottom-24 right-6 bg-[var(--bg-secondary)] dark:bg-slate-800 text-[var(--text-primary)] dark:text-slate-200 rounded-full p-2 shadow-lg transition-all duration-200 z-10"
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-14 right-6 bg-[var(--bg-secondary)] dark:bg-slate-800 text-[var(--text-primary)] dark:text-slate-200 rounded-full p-2 shadow-lg transition-all duration-200 z-10"
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}
    </>
  );
};

export default ScrollButtons;
