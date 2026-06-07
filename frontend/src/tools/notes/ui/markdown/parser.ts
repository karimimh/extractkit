import type { MarkdownToken } from "./types";
import { isSpecialLine } from "./utils";

export const parseMarkdown = (
  markdown: string
): { tokens: MarkdownToken[]; lineIndexMap: Map<number, number> } => {
  const lines = markdown.split("\n");
  const tokens: MarkdownToken[] = [];
  let i = 0;
  const lineIndexMap = new Map<number, number>();

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      tokens.push({
        type: "header",
        level: headerMatch[1].length,
        content: headerMatch[2],
        lineStart: i,
      });
      i++;
      continue;
    }

    if (line.trim().startsWith("```")) {
      const language = line.trim().slice(3);
      const startLine = i;
      let codeContent = "";
      i++;

      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeContent += lines[i] + "\n";
        i++;
      }

      tokens.push({
        type: "code_block",
        content: codeContent.trim(),
        language,
        lineStart: startLine,
      });
      i++;
      continue;
    }

    if (line.trim().startsWith(">")) {
      const startLine = i;
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().slice(1).trimStart());
        i++;
      }
      tokens.push({
        type: "blockquote",
        content: quoteLines.join("\n"),
        lineStart: startLine,
      });
      continue;
    }

    if (line.match(/^\s*[-*+]\s+/)) {
      const items: string[] = [];
      const checkboxStates: (boolean | null)[] = [];
      const startLine = i;
      while (i < lines.length && lines[i].match(/^\s*[-*+]\s+/)) {
        const lineContent = lines[i].replace(/^\s*[-*+]\s+/, "");
        const checkboxMatch = lineContent.match(/^\[([x ])?\]\s+(.*)$/);
        if (checkboxMatch) {
          checkboxStates.push(checkboxMatch[1] === "x");
          items.push(checkboxMatch[2]);
        } else {
          checkboxStates.push(null);
          items.push(lineContent);
        }
        i++;
      }
      const tokenIndex = tokens.length;
      lineIndexMap.set(tokenIndex, startLine);
      tokens.push({
        type: "list",
        items,
        ordered: false,
        checkboxStates,
        lineStart: startLine,
      });
      continue;
    }

    if (line.match(/^\s*\d+\.\s+/)) {
      const startLine = i;
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\s*\d+\.\s+/)) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      tokens.push({
        type: "list",
        items,
        ordered: true,
        lineStart: startLine,
      });
      continue;
    }

    if (line.includes("|")) {
      const startLine = i;
      const tableRows: string[][] = [];
      let headers: string[] = [];

      if (line.includes("|")) {
        headers = line
          .split("|")
          .map(cell => cell.trim())
          .filter(cell => cell);
        i++;

        if (i < lines.length && lines[i].match(/^\s*\|?[\s\-:|]+\|?\s*$/)) {
          i++;
        }

        while (i < lines.length && lines[i].includes("|")) {
          const row = lines[i]
            .split("|")
            .map(cell => cell.trim())
            .filter(cell => cell);
          if (row.length > 0) {
            tableRows.push(row);
          }
          i++;
        }

        tokens.push({
          type: "table",
          headers,
          rows: tableRows,
          lineStart: startLine,
        });
        continue;
      }
    }

    if (line.match(/^(\*{3,}|-{3,}|_{3,})$/)) {
      tokens.push({
        type: "hr",
        content: "",
        lineStart: i,
      });
      i++;
      continue;
    }

    const htmlBlockMatch = line.match(/^<(\/?)([a-zA-Z][a-zA-Z0-9]*)(\s[^>]*)?>/);
    if (htmlBlockMatch) {
      const tagName = htmlBlockMatch[2].toLowerCase();
      const blockTags = [
        "div",
        "p",
        "blockquote",
        "pre",
        "table",
        "ul",
        "ol",
        "li",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "hr",
        "br",
        "form",
        "fieldset",
        "address",
        "section",
        "article",
        "aside",
        "header",
        "footer",
        "nav",
        "main",
        "figure",
        "figcaption",
        "details",
        "summary",
      ];

      if (blockTags.includes(tagName)) {
        let htmlContent = line;
        const isSelfClosing = line.match(/<[^>]+\/>/) || tagName === "br" || tagName === "hr";

        if (!isSelfClosing && !htmlBlockMatch[1]) {
          const closingTag = `</${tagName}>`;
          i++;
          while (i < lines.length && !lines[i].includes(closingTag)) {
            htmlContent += "\n" + lines[i];
            i++;
          }
          if (i < lines.length) {
            htmlContent += "\n" + lines[i];
            i++;
          }
        } else {
          i++;
        }

        tokens.push({
          type: "html",
          html: htmlContent,
        });
        continue;
      }
    }

    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)$/);
    if (imageMatch) {
      tokens.push({
        type: "image",
        alt: imageMatch[1],
        src: imageMatch[2],
        title: imageMatch[3],
        lineStart: i,
      });
      i++;
      continue;
    }

    const startLine = i;
    let paragraphContent = line;
    i++;

    while (i < lines.length && lines[i].trim() !== "" && !isSpecialLine(lines[i])) {
      paragraphContent += "\n" + lines[i];
      i++;
    }

    tokens.push({
      type: "paragraph",
      content: paragraphContent,
      lineStart: startLine,
    });
  }

  return { tokens, lineIndexMap };
};
