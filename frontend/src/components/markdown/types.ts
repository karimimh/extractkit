export interface MarkdownToken {
  type: string;
  content?: string;
  level?: number;
  language?: string;
  href?: string;
  title?: string;
  alt?: string;
  src?: string;
  headers?: string[];
  rows?: string[][];
  items?: string[];
  ordered?: boolean;
  checkboxStates?: (boolean | null)[];
  html?: string;
  lineStart?: number;
}
