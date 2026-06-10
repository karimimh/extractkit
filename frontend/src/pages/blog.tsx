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
      "Learn how to turn any webpage into a clean custom PDF by removing ads, popups, cookie banners, navigation, and other unwanted elements before export.",
    canonical: "https://distillpage.com/blog/custom-pdf-from-webpage",
    toolName: "Web to PDF",
    toolPath: "/web-to-pdf",
    publishedAt: "2026-06-10",
    updatedAt: "2026-06-10",
    intro:
      "Saving a webpage as a PDF is easy until the page includes sticky headers, cookie banners, ads, sidebars, chat widgets, or collapsed sections you need to open first. A custom PDF workflow gives you control over the page before the final export.",
    sections: [
      {
        heading: "When a normal browser PDF is not enough",
        body: [
          "Browser print tools are useful for simple pages, but they often capture the page exactly as it is served. That means promotional banners, newsletter popups, floating buttons, and unrelated navigation can end up in the file.",
          "DistillPage loads the webpage in an interactive preview first. You can browse the page, expand the content you need, switch to remove mode, and click the parts that should not appear in the PDF.",
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
          "Open the Web to PDF tool, paste the URL, load the preview, remove the unwanted elements, choose the layout mode, and export. For repeated work, bulk mode can process several URLs into separate files or a combined export.",
        ],
      },
    ],
  },
  {
    slug: "remove-elements-before-website-screenshot",
    title: "How to Capture a Full Page Website Screenshot Without Clutter",
    description:
      "Capture a clean full-page website screenshot by removing ads, popups, cookie banners, sticky headers, and other page elements before saving the image.",
    canonical: "https://distillpage.com/blog/remove-elements-before-website-screenshot",
    toolName: "Web to Screenshot",
    toolPath: "/web-to-screenshot",
    publishedAt: "2026-06-10",
    updatedAt: "2026-06-10",
    intro:
      "A full-page website screenshot should show the page you care about, not every floating banner and overlay the site decides to add. Cleaning the page before capture gives you a screenshot that is easier to share, compare, and archive.",
    sections: [
      {
        heading: "Why full-page screenshots need cleanup",
        body: [
          "Most screenshot tools capture the visible page state. If a popup, cookie prompt, support widget, sticky menu, or ad is present, it becomes part of the final image. On long pages, repeated sticky elements can make the screenshot feel messy or misleading.",
          "DistillPage adds an interactive removal step before export. Load the page, click away the elements you do not want, and then capture the cleaned page as a high-resolution PNG.",
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
          "Open the Web to Screenshot tool, paste the URL, choose the viewport width, remove unwanted elements in the preview, and capture the screenshot. Bulk mode can capture several URLs when you need repeatable page evidence.",
        ],
      },
    ],
  },
  {
    slug: "convert-webpage-to-clean-markdown",
    title: "How to Convert a Webpage to Clean Markdown",
    description:
      "Convert a webpage to readable Markdown for notes, documentation, research, and LLM workflows while removing ads, navigation, banners, and other unwanted elements.",
    canonical: "https://distillpage.com/blog/convert-webpage-to-clean-markdown",
    toolName: "Web to Markdown",
    toolPath: "/web-to-markdown",
    publishedAt: "2026-06-10",
    updatedAt: "2026-06-10",
    intro:
      "Markdown is a practical format for notes, documentation, research archives, and LLM input. The hard part is getting the useful content from a webpage without dragging along navigation, ads, cookie notices, and unrelated layout fragments.",
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
          "DistillPage lets you preview the webpage and remove unwanted elements before export. That gives you a cleaner source for the Markdown conversion instead of forcing you to edit noisy output afterward.",
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
          "Open the Web to Markdown tool, paste the page URL, load the preview, remove unwanted elements, and export the cleaned content. Use bulk mode when you need Markdown from several related pages.",
        ],
      },
    ],
  },
];

const BLOG_SEO = {
  title: "DistillPage Blog",
  description:
    "Practical guides for creating clean PDFs, screenshots, and Markdown exports from webpages with DistillPage.",
  canonical: "https://distillpage.com/blog",
  jsonLd: {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "DistillPage Blog",
    url: "https://distillpage.com/blog",
    description:
      "Practical guides for creating clean PDFs, screenshots, and Markdown exports from webpages with DistillPage.",
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
          Practical articles for turning webpages into focused PDFs, screenshots, and
          Markdown files without carrying over ads, banners, popups, or unrelated page chrome.
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
