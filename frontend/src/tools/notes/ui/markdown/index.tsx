import { useTheme } from "@notes/context/ThemeContext";
import { getContrastBgColor } from "@notes/utils/color-utils";
import { cn } from "@notes/utils/css-utils";
import { getAbsoluteImageUrl } from "@notes/utils/image-url-utils";
import { useEffect } from "react";
import { createInlineParser } from "./inline-parser";
import { parseMarkdown } from "./parser";
import { createTokenRenderer } from "./token-renderer";

export interface MarkdownRendererProps {
  content: string;
  bgColor?: string;
  textColor?: string;
  className?: string;
  isPreview?: boolean;
  onCheckboxToggle?: (lineIndex: number) => void;
  disableSyntaxHighlighting?: boolean;
}

const MarkdownRenderer = ({
  content,
  bgColor,
  textColor,
  className,
  isPreview = false,
  onCheckboxToggle,
  disableSyntaxHighlighting = false,
}: MarkdownRendererProps) => {
  const { theme } = useTheme();

  useEffect(() => {
    const link = document.getElementById("hljs-theme");
    if (link) {
      link.remove();
    }

    const newLink = document.createElement("link");
    newLink.id = "hljs-theme";
    newLink.rel = "stylesheet";
    newLink.href =
      theme === "dark"
        ? new URL("highlight.js/styles/atom-one-dark.css", import.meta.url).href
        : new URL("highlight.js/styles/atom-one-light.css", import.meta.url).href;
    document.head.appendChild(newLink);
  }, [theme]);

  const parseInlineElements = createInlineParser(isPreview, bgColor, getContrastBgColor);
  const renderToken = createTokenRenderer(
    parseInlineElements,
    isPreview,
    bgColor,
    onCheckboxToggle,
    disableSyntaxHighlighting
  );
  const { tokens, lineIndexMap } = parseMarkdown(content);

  const resolveImageSrc = (src: string): string => {
    return getAbsoluteImageUrl(src);
  };

  const groupedTokens: Array<{
    type: "single" | "image-group";
    tokens: any[];
    startIndex: number;
  }> = [];
  let i = 0;

  while (i < tokens.length) {
    if (tokens[i].type === "image") {
      const imageGroup = [tokens[i]];
      let j = i + 1;

      while (j < tokens.length && tokens[j].type === "image") {
        imageGroup.push(tokens[j]);
        j++;
      }

      if (imageGroup.length > 1) {
        groupedTokens.push({ type: "image-group", tokens: imageGroup, startIndex: i });
        i = j;
      } else {
        groupedTokens.push({ type: "single", tokens: [tokens[i]], startIndex: i });
        i++;
      }
    } else {
      groupedTokens.push({ type: "single", tokens: [tokens[i]], startIndex: i });
      i++;
    }
  }

  return (
    <div
      className={cn("w-full max-w-full", className)}
      style={{
        fontFamily: "Source Sans 3, ui-sans-serif, system-ui, sans-serif",
        color: textColor,
      }}
    >
      {groupedTokens.map((group, groupIndex) => {
        if (group.type === "image-group") {
          return (
            <div key={`image-group-${groupIndex}`} className="flex flex-wrap gap-2 mb-4">
              {group.tokens.map((token, tokenIndex) => (
                <div key={`${group.startIndex + tokenIndex}`} className="flex-shrink-0 max-w-full">
                  <img
                    src={resolveImageSrc(token.src || "")}
                    alt={token.alt || ""}
                    title={token.title}
                    className="max-w-full h-auto block"
                    style={{ backgroundColor: getContrastBgColor(bgColor) }}
                  />
                </div>
              ))}
            </div>
          );
        } else {
          return renderToken(group.tokens[0], group.startIndex, lineIndexMap);
        }
      })}
    </div>
  );
};

export default MarkdownRenderer;
