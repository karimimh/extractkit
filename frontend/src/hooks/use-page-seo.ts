import { useEffect } from "react";

export interface PageSeoOptions {
  title: string;
  description: string;
  canonical: string;
  jsonLd?: object;
}

function setMeta(attr: "name" | "property", value: string, content: string) {
  const el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${value}"]`);
  if (el) el.content = content;
}

/**
 * Updates document title, meta tags, canonical link, and JSON-LD structured
 * data for the current page. Pass module-level constants as options so the
 * effect only runs once on mount.
 */
export function usePageSeo({ title, description, canonical, jsonLd }: PageSeoOptions) {
  useEffect(() => {
    document.title = title;

    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:url", canonical);
    setMeta("property", "og:description", description);
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:url", canonical);
    setMeta("name", "twitter:description", description);

    const canonicalEl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonicalEl) canonicalEl.href = canonical;

    if (jsonLd) {
      let ldScript = document.getElementById("page-ld-json") as HTMLScriptElement | null;
      if (!ldScript) {
        ldScript = document.createElement("script");
        ldScript.type = "application/ld+json";
        ldScript.id = "page-ld-json";
        document.head.appendChild(ldScript);
      }
      ldScript.textContent = JSON.stringify(jsonLd);
    }
  }, [title, description, canonical, jsonLd]);
}
