
import { cn } from "@images/utils/css-utils";
import {
  ReactNode,
  useEffect,
  useRef,
  useState
} from "react";

interface CucumberProps {
  className?: string;
  children?: ReactNode;
}

const Cucumber = ({ className, children }: CucumberProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const node = contentRef.current;
    const resizeObserver = new ResizeObserver(() => {
      if (node) {
        const { width, height } = node.getBoundingClientRect();
        setDimensions({ width, height });
      }
    });

    if (node) {
      resizeObserver.observe(node);
    }

    return () => {
      if (node) {
        resizeObserver.unobserve(node);
      }
    };
  }, [children]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "rounded-l-full overflow-hidden rounded-r-full px-4 flex items-center justify-center",
        "transition-all duration-300 ease-in-out",
        className
      )}
      style={{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
      }}
    >
      <div ref={contentRef} className="inline-block py-2 px-4">
        {children}
      </div>
    </div>
  );
};

export default Cucumber;