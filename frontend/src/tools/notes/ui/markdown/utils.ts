export const isSpecialLine = (line: string): boolean => {
  const checks = [
    line.match(/^#{1,6}\s/),
    line.trim().startsWith("```"),
    line.trim().startsWith(">"),
    line.match(/^\s*[-*+]\s+/),
    line.match(/^\s*\d+\.\s+/),
    line.includes("|"),
    line.match(/^(\*{3,}|-{3,}|_{3,})$/),
    line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/),
    line.match(/^<(\/?)([a-zA-Z][a-zA-Z0-9]*)/),
  ];
  return checks.some(check => Boolean(check));
};

export const decodeHtmlEntities = (text: string): string => {
  const entities: Record<string, string> = {
    "&emsp;": "\u2003",
    "&ensp;": "\u2002",
    "&nbsp;": "\u00A0",
    "&lt;": "<",
    "&gt;": ">",
    "&amp;": "&",
    "&quot;": '"',
    "&apos;": "'",
  };

  return text.replace(/&[a-z]+;/gi, match => entities[match.toLowerCase()] || match);
};
