import { getContrastBgColor } from "./color-utils";
import { getAbsoluteImageUrl } from "./image-url-utils";
import { getTextDirection } from "./text-direction";
import React from "react";
import CodeBlock from "./code-block";
import { parseMarkdown } from "./parser";
import type { MarkdownToken } from "./types";

export const createTokenRenderer = (
  parseInlineElements: (text: string) => React.ReactNode,
  isPreview: boolean,
  bgColor?: string,
  onCheckboxToggle?: (lineIndex: number) => void,
  disableSyntaxHighlighting = false
) => {
  const renderToken = (
    token: MarkdownToken,
    index: number,
    lineIndexMap: Map<number, number>
  ): React.ReactNode => {
    switch (token.type) {
      case "header": {
        const level = token.level || 1;
        const content = token.content || "";
        const direction = getTextDirection(content);
        const textAlign: "left" | "right" = direction === "rtl" ? "right" : "left";
        const isFirstToken = index === 0;
        const headerClasses = isPreview
          ? {
              1: isFirstToken ? "text-lg font-bold mb-1" : "text-lg font-bold mt-2 mb-1",
              2: isFirstToken ? "text-base font-bold mb-1" : "text-base font-bold mt-2 mb-1",
              3: isFirstToken ? "text-sm font-bold mb-1" : "text-sm font-bold mt-1 mb-1",
              4: isFirstToken ? "text-sm font-bold mb-1" : "text-sm font-bold mt-1 mb-1",
              5: isFirstToken ? "text-xs font-bold mb-0.5" : "text-xs font-bold mt-1 mb-0.5",
              6: isFirstToken ? "text-xs font-bold mb-0.5" : "text-xs font-bold mt-1 mb-0.5",
            }
          : {
              1: isFirstToken ? "text-3xl font-bold mb-2" : "text-3xl font-bold mt-8 mb-2",
              2: isFirstToken ? "text-2xl font-bold mb-2" : "text-2xl font-bold mt-6 mb-2",
              3: isFirstToken ? "text-xl font-bold mb-2" : "text-xl font-bold mt-4 mb-2",
              4: isFirstToken ? "text-lg font-bold mb-2" : "text-lg font-bold mt-3 mb-2",
              5: isFirstToken ? "text-base font-bold mb-1" : "text-base font-bold mt-2 mb-1",
              6: isFirstToken ? "text-sm font-bold mb-1" : "text-sm font-bold mt-2 mb-1",
            };

        const className = headerClasses[level as keyof typeof headerClasses];

        const HeaderElement = ({ children }: { children: React.ReactNode }) => {
          const headerStyle = {
            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            textAlign,
          };
          const dataProps =
            token.lineStart !== undefined ? { "data-line-start": token.lineStart } : {};
          if (level === 1)
            return (
              <h1 className={className} style={headerStyle} dir={direction} {...dataProps}>
                {children}
              </h1>
            );
          if (level === 2)
            return (
              <h2 className={className} style={headerStyle} dir={direction} {...dataProps}>
                {children}
              </h2>
            );
          if (level === 3)
            return (
              <h3 className={className} style={headerStyle} dir={direction} {...dataProps}>
                {children}
              </h3>
            );
          if (level === 4)
            return (
              <h4 className={className} style={headerStyle} dir={direction} {...dataProps}>
                {children}
              </h4>
            );
          if (level === 5)
            return (
              <h5 className={className} style={headerStyle} dir={direction} {...dataProps}>
                {children}
              </h5>
            );
          return (
            <h6 className={className} style={headerStyle} dir={direction} {...dataProps}>
              {children}
            </h6>
          );
        };

        return (
          <div
            key={index}
            className={isPreview ? "mb-1" : "mb-4"}
            data-line-start={token.lineStart}
          >
            <HeaderElement>{parseInlineElements(content)}</HeaderElement>
          </div>
        );
      }

      case "paragraph": {
        const paragraphDirection = getTextDirection(token.content || "");
        const paragraphAlign = paragraphDirection === "rtl" ? "right" : "left";
        return (
          <p
            key={index}
            className={
              isPreview
                ? "mb-1 leading-normal text-sm break-words"
                : "mb-4 leading-relaxed break-words"
            }
            dir={paragraphDirection}
            style={{ textAlign: paragraphAlign }}
            data-line-start={token.lineStart}
          >
            {parseInlineElements(token.content || "")}
          </p>
        );
      }

      case "code_block": {
        return (
          <CodeBlock
            key={index}
            code={token.content || ""}
            language={token.language}
            isPreview={isPreview}
            bgColor={bgColor}
            disableSyntaxHighlighting={disableSyntaxHighlighting}
            lineStart={token.lineStart}
          />
        );
      }

      case "blockquote": {
        const blockquoteContent = token.content || "";
        const { tokens: nestedTokens } = parseMarkdown(blockquoteContent);
        const blockquoteDirection = getTextDirection(blockquoteContent);
        const blockquoteAlign = blockquoteDirection === "rtl" ? "right" : "left";
        const blockquoteBorderClass =
          blockquoteDirection === "rtl"
            ? isPreview
              ? "border-r-2 border-current pr-2"
              : "border-r-4 border-current pr-4"
            : isPreview
            ? "border-l-2 border-current pl-2"
            : "border-l-4 border-current pl-4";
        const hasBlockElements = nestedTokens.length > 0;
        return (
          <blockquote
            key={index}
            className={`${blockquoteBorderClass} ${
              isPreview ? "mb-1 text-sm" : "mb-4"
            } break-words ${hasBlockElements ? "" : "italic"}`}
            dir={blockquoteDirection}
            style={{ textAlign: blockquoteAlign, borderColor: "currentColor", opacity: 0.65 }}
            data-line-start={token.lineStart}
          >
            {hasBlockElements
              ? nestedTokens.map((nestedToken, nestedIndex) =>
                  renderToken(nestedToken, nestedIndex, lineIndexMap)
                )
              : parseInlineElements(blockquoteContent)}
          </blockquote>
        );
      }

      case "list": {
        const ListTag = token.ordered ? "ol" : "ul";
        const hasCheckboxes = token.checkboxStates?.some(state => state !== null);
        const listText = token.items?.join(" ") || "";
        const listDirection = getTextDirection(listText);
        const listAlign: "left" | "right" = listDirection === "rtl" ? "right" : "left";
        const listClass = token.ordered
          ? "list-decimal"
          : hasCheckboxes
          ? "list-none"
          : "list-disc";
        const paddingClass =
          listDirection === "rtl" ? (isPreview ? "pr-4" : "pr-6") : isPreview ? "pl-4" : "pl-6";

        const listStyle: React.CSSProperties = {
          textAlign: listAlign,
          ...(listDirection === "rtl" && token.ordered ? { listStylePosition: "inside" } : {}),
        };

        const startLineIndex = lineIndexMap.get(index) || 0;

        return (
          <ListTag
            key={index}
            className={`${listClass} ${paddingClass} ${isPreview ? "mb-1 text-sm" : "mb-4"}`}
            dir={listDirection}
            style={listStyle}
            data-line-start={token.lineStart}
          >
            {token.items?.map((item, itemIndex) => {
              const checkboxState = token.checkboxStates?.[itemIndex];
              return (
                <li key={itemIndex} className={isPreview ? "mb-0.5" : "mb-1"}>
                  {checkboxState !== null && checkboxState !== undefined ? (
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checkboxState}
                        onChange={() => {
                          if (onCheckboxToggle) {
                            onCheckboxToggle(startLineIndex + itemIndex);
                          }
                        }}
                        className="mt-1 cursor-pointer"
                      />
                      <span>{parseInlineElements(item)}</span>
                    </label>
                  ) : (
                    parseInlineElements(item)
                  )}
                </li>
              );
            })}
          </ListTag>
        );
      }

      case "table":
        return (
          <div
            key={index}
            className={
              isPreview ? "overflow-x-auto mb-1 max-w-full" : "overflow-x-auto mb-4 max-w-full"
            }
            data-line-start={token.lineStart}
          >
            <table className="min-w-full border-collapse table-auto">
              <thead>
                <tr style={{ backgroundColor: getContrastBgColor(bgColor) }}>
                  {token.headers?.map((header, headerIndex) => (
                    <th
                      key={headerIndex}
                      className={
                        isPreview
                          ? "border-b-2 border-current px-2 py-1 text-left font-semibold break-words text-xs"
                          : "border-b-2 border-current px-4 py-2 text-left font-semibold break-words"
                      }
                    >
                      {parseInlineElements(header)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {token.rows?.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    style={{
                      backgroundColor:
                        rowIndex % 2 === 0 ? "transparent" : getContrastBgColor(bgColor),
                    }}
                  >
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className={
                          isPreview
                            ? "border-b border-current px-2 py-1 break-words text-xs"
                            : "border-b border-current px-4 py-2 break-words"
                        }
                      >
                        {parseInlineElements(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "hr":
        return (
          <hr
            key={index}
            className={isPreview ? "border-current my-2" : "border-current my-8"}
            data-line-start={token.lineStart}
          />
        );

      case "image":
        return (
          <div key={index} className="mb-4" data-line-start={token.lineStart}>
            <img
              src={getAbsoluteImageUrl(token.src || "")}
              alt={token.alt || ""}
              title={token.title}
              className="max-w-full h-auto block"
              style={{ backgroundColor: getContrastBgColor(bgColor) }}
            />
          </div>
        );

      case "html":
        return (
          <div
            key={index}
            className={isPreview ? "mb-1" : "mb-4"}
            dangerouslySetInnerHTML={{ __html: token.html || "" }}
            data-line-start={token.lineStart}
          />
        );

      default:
        return null;
    }
  };

  return renderToken;
};
