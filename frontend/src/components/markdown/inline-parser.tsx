import { getAbsoluteImageUrl } from "./image-url-utils";
import React from "react";
import { emojiMap, emoticonMap } from "./emoji-map";
import { decodeHtmlEntities } from "./utils";

export const createInlineParser = (
  isPreview: boolean,
  bgColor?: string,
  getContrastBgColor?: (color?: string) => string
) => {
  const parseInlineElements = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      const entityMatch = remaining.match(/^(.*?)(&[a-z]+;)(.*)$/is);
      if (entityMatch) {
        if (entityMatch[1]) parts.push(parseInlineElements(entityMatch[1]));
        const decoded = decodeHtmlEntities(entityMatch[2]);
        parts.push(decoded);
        remaining = entityMatch[3];
        continue;
      }

      const boldMatch =
        remaining.match(/^(.*?)\*\*(.*?)\*\*(.*)$/s) || remaining.match(/^(.*?)__(.*?)__(.*)$/s);
      if (boldMatch) {
        if (boldMatch[1]) parts.push(parseInlineElements(boldMatch[1]));
        parts.push(<strong key={key++}>{parseInlineElements(boldMatch[2])}</strong>);
        remaining = boldMatch[3];
        continue;
      }

      const italicMatch = remaining.match(/^(.*?)(?<!\w)[*_]([^*_]+?)[*_](?!\w)(.*)$/s);
      if (italicMatch && !remaining.startsWith("**") && !remaining.startsWith("__")) {
        if (italicMatch[1]) parts.push(parseInlineElements(italicMatch[1]));
        parts.push(<em key={key++}>{parseInlineElements(italicMatch[2])}</em>);
        remaining = italicMatch[3];
        continue;
      }

      const codeMatch = remaining.match(/^(.*?)`(.*?)`(.*)$/s);
      if (codeMatch) {
        if (codeMatch[1]) parts.push(parseInlineElements(codeMatch[1]));
        parts.push(
          <code
            key={key++}
            className={
              isPreview
                ? "px-0.5 py-0.5 rounded text-xs font-mono break-all"
                : "px-1 py-0.5 rounded text-sm font-mono break-all"
            }
            style={{ backgroundColor: getContrastBgColor?.(bgColor) }}
          >
            {codeMatch[2]}
          </code>
        );
        remaining = codeMatch[3];
        continue;
      }

      const linkMatch = remaining.match(/^(.*?)\[([^\]]*)\]\(([^)]+)\)(.*)$/s);
      if (linkMatch) {
        if (linkMatch[1]) parts.push(parseInlineElements(linkMatch[1]));
        parts.push(
          <a
            key={key++}
            href={linkMatch[3]}
            className="hover:underline break-all underline decoration-current"
            target="_blank"
            rel="noopener noreferrer"
          >
            {parseInlineElements(linkMatch[2])}
          </a>
        );
        remaining = linkMatch[4];
        continue;
      }

      const imageMatch = remaining.match(/^(.*?)!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)(.*)$/s);
      if (imageMatch) {
        if (imageMatch[1]) parts.push(parseInlineElements(imageMatch[1]));
        parts.push(
          <img
            key={key++}
            src={getAbsoluteImageUrl(imageMatch[3])}
            alt={imageMatch[2]}
            title={imageMatch[4]}
            className="max-w-full h-auto block"
          />
        );
        remaining = imageMatch[5];
        continue;
      }

      const typographicReplacements: Array<[RegExp, string]> = [
        [/^(.*?)\(c\)(.*)$/is, "©"],
        [/^(.*?)\(r\)(.*)$/is, "®"],
        [/^(.*?)\(tm\)(.*)$/is, "™"],
        [/^(.*?)\(p\)(.*)$/is, "§"],
        [/^(.*?)\+-(.*)$/s, "±"],
        [/^(.*?)\.\.\.(.*)$/s, "…"],
        [/^(.*?)---(.*)$/s, "—"],
        [/^(.*?)--(.*)$/s, "–"],
        [/^(.*?)!{6,}(.*)$/s, "!!!"],
        [/^(.*?)\?{4,}(.*)$/s, "???"],
        [/^(.*?),,(.*)$/s, ","],
      ];

      let typographicFound = false;
      for (const [regex, replacement] of typographicReplacements) {
        const typoMatch = remaining.match(regex);
        if (typoMatch) {
          if (typoMatch[1]) parts.push(parseInlineElements(typoMatch[1]));
          parts.push(replacement);
          remaining = typoMatch[2];
          typographicFound = true;
          break;
        }
      }
      if (typographicFound) continue;

      const urlMatch = remaining.match(/^(.*?)(https?:\/\/\S+)(.*)$/s);
      if (urlMatch) {
        if (urlMatch[1]) parts.push(parseInlineElements(urlMatch[1]));
        parts.push(urlMatch[2]);
        remaining = urlMatch[3];
        continue;
      }

      const emojiMatch = remaining.match(/^(.*?):([a-z_]+):(.*)$/s);
      if (emojiMatch) {
        const emojiCode = emojiMatch[2];
        if (emojiMap[emojiCode]) {
          if (emojiMatch[1]) parts.push(parseInlineElements(emojiMatch[1]));
          parts.push(emojiMap[emojiCode]);
          remaining = emojiMatch[3];
          continue;
        }
      }

      const emoticonPatterns = Object.keys(emoticonMap).sort((a, b) => b.length - a.length);
      let emoticonFound = false;
      for (const emoticon of emoticonPatterns) {
        const escapedEmoticon = emoticon.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const emoticonRegex = new RegExp(`^(.*?)(${escapedEmoticon})(.*)$`, "s");
        const emoticonMatch = remaining.match(emoticonRegex);
        if (emoticonMatch) {
          if (emoticonMatch[1]) parts.push(parseInlineElements(emoticonMatch[1]));
          parts.push(emoticonMap[emoticon]);
          remaining = emoticonMatch[3];
          emoticonFound = true;
          break;
        }
      }
      if (emoticonFound) continue;

      const strikeMatch = remaining.match(/^(.*?)~~(.*?)~~(.*)$/s);
      if (strikeMatch) {
        if (strikeMatch[1]) parts.push(parseInlineElements(strikeMatch[1]));
        parts.push(<del key={key++}>{parseInlineElements(strikeMatch[2])}</del>);
        remaining = strikeMatch[3];
        continue;
      }

      const htmlMatch = remaining.match(
        /^(.*?)(<[a-zA-Z][^>]*>.*?<\/[a-zA-Z]+>|<[a-zA-Z][^>]*?\/?>)(.*)$/s
      );
      if (htmlMatch) {
        if (htmlMatch[1]) parts.push(parseInlineElements(htmlMatch[1]));
        parts.push(<span key={key++} dangerouslySetInnerHTML={{ __html: htmlMatch[2] }} />);
        remaining = htmlMatch[3];
        continue;
      }

      if (remaining.includes("  \n")) {
        const parts = remaining.split("  \n");
        const result: React.ReactNode[] = [];
        parts.forEach((part, index) => {
          if (index > 0) result.push(<br key={`br-${key++}`} />);
          if (part) result.push(parseInlineElements(part));
        });
        return result.length === 1 ? result[0] : result;
      }

      parts.push(remaining);
      break;
    }

    return parts.length === 1 ? parts[0] : parts;
  };

  return parseInlineElements;
};
