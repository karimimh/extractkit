import { useTheme } from "../../context/theme-context";
import CopyButton from "./copy-button";
import React from "react";
import { highlightCode } from "./syntax-highlighter";

interface CodeBlockProps {
  code: string;
  language?: string;
  isPreview: boolean;
  bgColor?: string;
  disableSyntaxHighlighting?: boolean;
  lineStart?: number;
}

const CodeBlock = React.memo(
  ({ code, language, isPreview, disableSyntaxHighlighting = false, lineStart }: CodeBlockProps) => {
    const { resolvedTheme } = useTheme();
    const highlightedContent = React.useMemo(() => {
      if (disableSyntaxHighlighting) {
        return code;
      }
      return highlightCode(code, language);
    }, [code, language, disableSyntaxHighlighting]);

    const backgroundColor = React.useMemo(
      () => (resolvedTheme === "dark" ? "#282c34" : "#fafafa"),
      [resolvedTheme]
    );

    const dataProps = lineStart !== undefined ? { "data-line-start": lineStart } : {};

    return (
      <div className="relative group">
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <CopyButton text={code} size={isPreview ? 14 : 16} />
        </div>
        <pre
          className={
            isPreview
              ? "p-2 rounded text-xs mb-1 overflow-x-auto max-w-full border border-[var(--border-primary)] bg-gray-100 shadow"
              : "p-4 rounded-lg mb-4 overflow-x-auto max-w-full border border-[var(--border-primary)] bg-gray-100 shadow"
          }
          style={{ backgroundColor }}
          {...dataProps}
        >
          {typeof highlightedContent === "string" ? (
            <code
              className={
                isPreview
                  ? "text-xs font-mono whitespace-pre-wrap break-all"
                  : "text-sm font-mono whitespace-pre-wrap break-all"
              }
            >
              {highlightedContent}
            </code>
          ) : (
            <code
              className={
                isPreview
                  ? "text-xs font-mono whitespace-pre-wrap break-all"
                  : "text-sm font-mono whitespace-pre-wrap break-all"
              }
            >
              {highlightedContent}
            </code>
          )}
        </pre>
      </div>
    );
  }
);

CodeBlock.displayName = "CodeBlock";

export default CodeBlock;
