const RTL_REGEX = /[\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/;

export function isRTL(text: string): boolean {
  if (!text) return false;

  const cleaned = text.trim();
  if (!cleaned) return false;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (/\s/.test(char)) continue;
    return RTL_REGEX.test(char);
  }

  return false;
}

export function getTextDirection(text: string): "rtl" | "ltr" {
  return isRTL(text) ? "rtl" : "ltr";
}
