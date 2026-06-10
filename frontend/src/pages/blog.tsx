import { Link, Navigate, useParams } from "react-router-dom";
import { usePageSeo } from "../hooks/use-page-seo";

type ArticleSection = {
  heading: string;
  body: string[];
};

type Article = {
  slug: string;
  title: string;
  description: string;
  canonical: string;
  toolName: string;
  toolPath: string;
  publishedAt: string;
  updatedAt: string;
  intro: string;
  sections: ArticleSection[];
};

const ARTICLES: Article[] = [
  {
    slug: "custom-pdf-from-webpage",
    title: "How to Create a Custom PDF from a Webpage",
    description:
      "Learn how to turn any webpage into a custom PDF using AI Cleanup, full-page export, or manual interaction.",
    canonical: "https://distillpage.com/blog/custom-pdf-from-webpage",
    toolName: "Web to PDF",
    toolPath: "/web-to-pdf",
    publishedAt: "2026-06-10",
    updatedAt: "2026-06-10",
    intro:
      "Saving a webpage as a PDF is easy until the page includes sticky headers, cookie banners, ads, sidebars, or chat widgets. DistillPage lets you use AI Cleanup, export the full page, or manually control the page before the final PDF.",
    sections: [
      {
        heading: "When a normal browser PDF is not enough",
        body: [
          "Browser print tools are useful for simple pages, but they often capture the page exactly as it is served. That means promotional banners, newsletter popups, floating buttons, and unrelated navigation can end up in the file.",
          "DistillPage provides three cleanup methods. Full Page export keeps the page unchanged. AI Cleanup asks OpenAI to identify page chrome and interruptions while preserving the primary content. Manual Interaction opens an interactive preview where you can browse, expand content, and click exactly what should be removed.",
        ],
      },
      {
        heading: "AI Cleanup or Manual Interaction",
        body: [
          "AI Cleanup is useful when you want a clean result quickly or need to process several pages with unfamiliar HTML structures. It analyzes the page content and structure instead of relying only on known class names.",
          "Manual Interaction is the default for single-page exports because it gives you direct control. Use it when the page has interactive sections to open, when a useful sidebar should remain, or when you need an exact visual result.",
        ],
      },
      {
        heading: "What to remove before exporting",
        body: [
          "Start with anything that distracts from the main content: cookie notices, ad blocks, sticky headers, sidebars, social share bars, chat launchers, and footer modules. For long pages, also check whether accordions, tabs, or menus need to be opened before capture.",
          "This is especially helpful for research, receipts, product documentation, articles, pricing pages, and reference pages where you want a clean archived copy instead of a noisy screenshot of the whole site chrome.",
        ],
      },
      {
        heading: "Screen layout or print layout",
        body: [
          "Some pages have a dedicated print stylesheet, while others look better in their screen layout. DistillPage lets you choose the layout mode before generating the PDF, so you can keep the version that preserves the content most accurately.",
          "If the page has complex columns or interactive sections, preview it first and compare the result. The goal is not just to save a page, but to create a readable PDF that still looks intentional.",
        ],
      },
      {
        heading: "How to make the PDF",
        body: [
          "Open the Web to PDF tool, paste the URL, and choose Full Page export, AI Cleanup, or Manual Interaction. With Manual Interaction, use the preview to browse and remove elements. Then choose the layout mode and export. Bulk mode supports Full Page export and AI Cleanup.",
        ],
      },
    ],
  },
  {
    slug: "remove-elements-before-website-screenshot",
    title: "How to Capture a Full Page Website Screenshot Without Clutter",
    description:
      "Capture a clean website screenshot using AI Cleanup, full-page export, or manual interaction before saving the image.",
    canonical: "https://distillpage.com/blog/remove-elements-before-website-screenshot",
    toolName: "Web to Screenshot",
    toolPath: "/web-to-screenshot",
    publishedAt: "2026-06-10",
    updatedAt: "2026-06-10",
    intro:
      "A website screenshot should show the page you care about, not every floating banner and overlay the site decides to add. DistillPage offers AI Cleanup, Full Page export, and Manual Interaction before capture.",
    sections: [
      {
        heading: "Why full-page screenshots need cleanup",
        body: [
          "Most screenshot tools capture the visible page state. If a popup, cookie prompt, support widget, sticky menu, or ad is present, it becomes part of the final image. On long pages, repeated sticky elements can make the screenshot feel messy or misleading.",
          "Use AI Cleanup when you want OpenAI to identify common interruptions automatically. Use Full Page export when every element should remain. Manual Interaction, the default for single-page captures, lets you browse the page and click away only the elements you do not want.",
        ],
      },
      {
        heading: "Choose the right cleanup method",
        body: [
          "AI Cleanup works well for quick captures and unfamiliar websites because it evaluates the DOM structure, labels, and visible text. It can identify navigation, ads, cookie prompts, popups, footers, and unrelated sidebars even when the site uses custom class names.",
          "Manual Interaction is better for design review and QA where the exact page state matters. Open tabs, expand accordions, preserve useful controls, and remove only the elements that should not appear in the evidence.",
        ],
      },
      {
        heading: "Choosing the right viewport",
        body: [
          "A page can look very different on mobile, tablet, desktop, and wide screens. If you are documenting responsive design, QA issues, marketing pages, or competitor layouts, choosing the viewport width matters.",
          "The Web to Screenshot tool supports common viewport widths so the image matches the context you need. Use mobile for narrow layouts, desktop for standard web captures, and wide mode when the design uses more horizontal space.",
        ],
      },
      {
        heading: "Good screenshot cleanup targets",
        body: [
          "Remove anything that blocks content or changes the visual story: cookie banners, modals, newsletter forms, floating share buttons, chat bubbles, sticky sale banners, and irrelevant navigation. Keep elements that explain the page state, such as selected filters or opened menus.",
          "For design review or QA, capture the page after interacting with it. Open tabs, expand accordions, accept required prompts, and then remove only the pieces that should not be part of the evidence.",
        ],
      },
      {
        heading: "How to capture the clean screenshot",
        body: [
          "Open the Web to Screenshot tool, paste the URL, choose Full Page export, AI Cleanup, or Manual Interaction, select the viewport width, and capture the screenshot. Bulk mode supports Full Page export and AI Cleanup for repeatable captures.",
        ],
      },
    ],
  },
  {
    slug: "convert-webpage-to-clean-markdown",
    title: "How to Convert a Webpage to Clean Markdown",
    description:
      "Convert a webpage to readable Markdown using AI Cleanup, full-page export, or manual element removal.",
    canonical: "https://distillpage.com/blog/convert-webpage-to-clean-markdown",
    toolName: "Web to Markdown",
    toolPath: "/web-to-markdown",
    publishedAt: "2026-06-10",
    updatedAt: "2026-06-10",
    intro:
      "Markdown is a practical format for notes, documentation, research archives, and LLM input. DistillPage can preserve the full page, use AI Cleanup to identify unrelated elements, or let you manually control what reaches the final Markdown.",
    sections: [
      {
        heading: "Why clean Markdown is better than raw HTML",
        body: [
          "HTML is built for browsers, not for reading, editing, or feeding into documentation workflows. A raw page can include scripts, tracking markup, navigation, repeated links, promotional blocks, and layout containers that add noise.",
          "Clean Markdown keeps headings, paragraphs, lists, links, and other readable structure while leaving behind the parts that only matter to the original website layout.",
        ],
      },
      {
        heading: "Remove page clutter before conversion",
        body: [
          "A converter can only work with the page state it receives. If the webpage includes a modal, a subscription banner, a sticky header, or a large sidebar, those elements can pollute the Markdown output.",
          "AI Cleanup asks OpenAI to identify navigation, ads, cookie notices, signup prompts, footers, and unrelated sidebars before conversion. This works across websites that use different class names and DOM structures.",
          "Manual Interaction is the default for single-page conversion and lets you preview the webpage and remove exact elements before export. Full Page export keeps everything when cleanup is not appropriate.",
        ],
      },
      {
        heading: "When to use AI Cleanup",
        body: [
          "AI Cleanup is useful for research collections, documentation ingestion, and LLM workflows where repeated site chrome adds noise. The model receives a compact DOM outline and chooses unwanted containers while preserving primary content.",
          "Use Manual Interaction when you need to inspect the page first or preserve unusual supporting content. Use Full Page export when the complete page structure is part of the material you need.",
        ],
      },
      {
        heading: "Common uses for webpage to Markdown conversion",
        body: [
          "Researchers can save readable source material. Developers can move web documentation into local notes. Content teams can turn reference pages into editable drafts. AI workflows can use clean Markdown as more compact, structured context than raw HTML.",
          "For bulk work, converting multiple URLs into Markdown files creates a consistent archive that is easier to search, diff, summarize, and reuse.",
        ],
      },
      {
        heading: "How to export Markdown from a URL",
        body: [
          "Open the Web to Markdown tool, paste the page URL, and choose Full Page export, AI Cleanup, or Manual Interaction. Manual Interaction opens the preview for exact removal. Use bulk mode with Full Page export or AI Cleanup when you need Markdown from several related pages.",
        ],
      },
    ],
  },
  {
    slug: "extract-structured-json-from-webpage",
    title: "How to Extract Structured JSON from a Webpage",
    description:
      "Extract structured JSON from any webpage using AI Cleanup, full-page export, or manual interaction.",
    canonical: "https://distillpage.com/blog/extract-structured-json-from-webpage",
    toolName: "Web to JSON",
    toolPath: "/web-to-json",
    publishedAt: "2026-06-10",
    updatedAt: "2026-06-10",
    intro:
      "Webpages contain useful data, but it is usually trapped inside layout HTML, navigation, scripts, ads, and repeated page chrome. DistillPage can use AI Cleanup, preserve the full page, or let you manually control the source before creating structured JSON.",
    sections: [
      {
        heading: "Why structured JSON is useful",
        body: [
          "Markdown is great for readable content, but developers and data teams often need fields they can parse directly. Structured JSON separates the page title, author, date, headings, paragraphs, tables, images, links, and metadata into a shape that can be consumed by scripts, databases, and LLM pipelines.",
          "This is helpful for AI developers building ingestion pipelines, data engineers collecting web references, scrapers prototyping extraction rules, and teams that need repeatable page exports without manually copying content from the browser.",
        ],
      },
      {
        heading: "What the JSON export includes",
        body: [
          "The Web to JSON tool extracts common webpage fields such as title, author, published date, headings, paragraph text, tables, images, links, canonical URL, meta tags, Open Graph tags, Twitter tags, and JSON-LD when the page provides it.",
          "Relative image and link URLs are resolved against the source page, which makes the output easier to use outside the original website. The result can be copied directly or downloaded as a .json file.",
        ],
      },
      {
        heading: "Clean the page before extracting",
        body: [
          "Many pages include cookie banners, newsletter forms, promotional blocks, sidebars, and repeated navigation that can pollute extracted data. AI Cleanup asks OpenAI to identify these unrelated containers even when each website uses different class names.",
          "Manual Interaction is the default for single-page extraction and opens a preview where you can remove exact elements. Full Page export preserves all page content when you need a complete dataset.",
        ],
      },
      {
        heading: "AI Cleanup for structured datasets",
        body: [
          "AI Cleanup is useful when creating datasets from several websites because it reduces repeated navigation links, promotional text, and unrelated page modules before fields are extracted.",
          "The model selects unwanted DOM containers rather than rewriting the page content. This helps preserve headings, paragraphs, tables, images, links, metadata, and other useful source material.",
        ],
      },
      {
        heading: "When to use bulk JSON export",
        body: [
          "Bulk mode is useful when you have several related URLs to process at once. You can export a ZIP with one JSON file per URL or create a combined JSON file for downstream processing.",
          "Use ZIP mode when each page should remain independent. Use combined JSON when you want a single payload for analysis, search indexing, comparison, summarization, or dataset creation.",
        ],
      },
      {
        heading: "How to extract webpage JSON",
        body: [
          "Open the Web to JSON tool, paste a URL, and choose Full Page export, AI Cleanup, or Manual Interaction. For multiple pages, switch to bulk mode, choose Full Page export or AI Cleanup, paste one URL per line, choose ZIP or combined JSON, and download the result.",
        ],
      },
    ],
  },
];

const BLOG_SEO = {
  title: "DistillPage Blog",
  description:
    "Practical guides for full-page exports, AI Cleanup, and manual webpage conversion with DistillPage.",
  canonical: "https://distillpage.com/blog",
  jsonLd: {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "DistillPage Blog",
    url: "https://distillpage.com/blog",
    description:
      "Practical guides for full-page exports, AI Cleanup, and manual webpage conversion with DistillPage.",
  },
};

function articleJsonLd(article: Article) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    mainEntityOfPage: article.canonical,
    author: {
      "@type": "Organization",
      name: "DistillPage",
    },
    publisher: {
      "@type": "Organization",
      name: "DistillPage",
    },
  };
}

export function BlogIndex() {
  usePageSeo(BLOG_SEO);

  return (
    <main className="article-page">
      <section className="article-hero">
        <p className="eyebrow">DistillPage Blog</p>
        <h1>Guides for cleaner webpage exports</h1>
        <p>
          Practical articles for turning webpages into focused PDFs, screenshots,
          Markdown files, and structured JSON using AI Cleanup, Full Page export,
          or Manual Interaction.
        </p>
      </section>

      <section className="article-list" aria-label="Blog posts">
        {ARTICLES.map((article) => (
          <article className="article-card" key={article.slug}>
            <p>{article.toolName}</p>
            <h2>
              <Link to={`/blog/${article.slug}`}>{article.title}</Link>
            </h2>
            <p>{article.description}</p>
            <Link className="article-link" to={`/blog/${article.slug}`}>
              Read article
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}

export function BlogPost() {
  const { slug } = useParams();
  const article = ARTICLES.find((item) => item.slug === slug);
  const pageArticle = article ?? ARTICLES[0];

  usePageSeo({
    title: `${pageArticle.title} - DistillPage`,
    description: pageArticle.description,
    canonical: pageArticle.canonical,
    jsonLd: articleJsonLd(pageArticle),
  });

  if (!article) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <main className="article-page">
      <article className="article-post">
        <nav className="article-breadcrumb" aria-label="Breadcrumb">
          <Link to="/blog">Blog</Link>
          <span>/</span>
          <span>{article.toolName}</span>
        </nav>

        <header className="article-hero">
          <p className="eyebrow">{article.toolName}</p>
          <h1>{article.title}</h1>
          <p>{article.intro}</p>
          <Link className="article-cta" to={article.toolPath}>
            Open {article.toolName}
          </Link>
        </header>

        <div className="article-body">
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
