import hljs from "highlight.js";
import React from "react";

export function highlightCode(code: string, language?: string): React.ReactNode {
  if (!language) {
    return code;
  }

  try {
    const highlighted = hljs.highlight(code, { language: language.toLowerCase() }).value;
    return <code className="hljs" dangerouslySetInnerHTML={{ __html: highlighted }} />;
  } catch {
    return hljs.highlight(code, { language: "plaintext" }).value;
  }
}
